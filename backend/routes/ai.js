const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const Goal = require('../models/Goal');

router.use(protect);

// Helper: call Groq API (OpenAI compatible)
async function callGroq(messages, maxTokens = 1024) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in .env file');
  }

  // Groq uses OpenAI-compatible chat completion format
  // messages = [{role, content}, ...]
  
  const body = {
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  };

  const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = await response.json();
  
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  
  throw new Error('Unexpected response format from Groq API');
}

const CATEGORIES = ['Work', 'Personal', 'Health', 'Learning', 'Finance', 'Other'];
const PRIORITIES = ['high', 'medium', 'low'];

function nextWeekdayDate(dayName) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const target = days.indexOf(dayName.toLowerCase());
  if (target === -1) return '';

  const date = new Date();
  const diff = (target - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split('T')[0];
}

function parseTime(text) {
  const match = text.match(/\b(?:at|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
    || text.match(/\b(?:at|by)\s+(\d{1,2}):(\d{2})\b/i);
  if (!match) return '';

  let hour = Number(match[1]);
  const minute = match[2] || '00';
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (!meridiem && hour > 23) return '';

  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function extractJsonObject(text) {
  const clean = text.replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object found');
    return JSON.parse(clean.slice(start, end + 1));
  }
}

function normalizeTaskData(taskData, originalPrompt = '') {
  const lowerPrompt = originalPrompt.toLowerCase();
  const priority = PRIORITIES.includes(taskData.priority) ? taskData.priority
    : /\b(urgent|asap|important|critical)\b/i.test(originalPrompt) ? 'high'
    : 'medium';

  const category = CATEGORIES.includes(taskData.category) ? taskData.category
    : CATEGORIES.find(c => lowerPrompt.includes(c.toLowerCase())) || 'Work';

  return {
    title: String(taskData.title || originalPrompt).trim(),
    desc: String(taskData.desc || '').trim(),
    priority,
    category,
    date: typeof taskData.date === 'string' ? taskData.date : '',
    time: typeof taskData.time === 'string' ? taskData.time : '',
    estimate: Number(taskData.estimate) || 0,
    tags: Array.isArray(taskData.tags) ? taskData.tags.filter(Boolean).map(String) : [],
    subtasks: Array.isArray(taskData.subtasks)
      ? taskData.subtasks.map(s => ({
          text: String(typeof s === 'string' ? s : s.text || '').trim(),
          done: Boolean(s.done),
        })).filter(s => s.text)
      : [],
    reminder: Number.isFinite(Number(taskData.reminder)) ? Number(taskData.reminder) : 15,
  };
}

function fallbackSmartCreate(prompt) {
  const lower = prompt.toLowerCase();
  const category = CATEGORIES.find(c => lower.includes(`${c.toLowerCase()} category`) || lower.includes(c.toLowerCase())) || 'Work';
  const priority = /\b(urgent|asap|critical|important|high priority)\b/i.test(prompt) ? 'high'
    : /\b(low priority|not urgent)\b/i.test(prompt) ? 'low'
    : 'medium';

  const weekday = lower.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/)?.[1];
  const date = weekday ? nextWeekdayDate(weekday) : '';
  const time = parseTime(prompt);

  let title = prompt
    .replace(/\bby\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)(\s+\d{1,2}(:\d{2})?\s*(am|pm)?)?/ig, '')
    .replace(/\bit'?s\s+urgent\b/ig, '')
    .replace(/\burgent\b/ig, '')
    .replace(new RegExp(`\\b${category}\\s+category\\b`, 'ig'), '')
    .replace(/\bcategory\b/ig, '')
    .replace(/[,\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!title) title = prompt.trim();
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const tags = [category.toLowerCase()];
  if (priority === 'high') tags.push('urgent');

  return normalizeTaskData({
    title,
    desc: '',
    priority,
    category,
    date,
    time,
    estimate: 0,
    tags,
    subtasks: [],
    reminder: priority === 'high' ? 30 : 15,
  }, prompt);
}

// ── 1. AI CHAT ASSISTANT ──────────────────────────────────────────────────────
// POST /api/ai/chat
// Body: { message, history: [{role,content}] }
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    // Load user's tasks for context
    const tasks = await Task.find({ userId: req.user._id, completed: false }).limit(20);
    const taskSummary = tasks.map(t =>
      `- "${t.title}" [${t.priority} priority, ${t.category}, due: ${t.date || 'no date'}]`
    ).join('\n');

    const systemPrompt = `You are TaskFlow AI, a smart productivity assistant integrated into the TaskFlow Pro task management app.
The user currently has these pending tasks:
${taskSummary || 'No pending tasks.'}

You help users:
- Prioritize and plan their tasks
- Break down complex tasks into subtasks
- Suggest time management strategies
- Analyze productivity patterns
- Answer questions about their tasks
- Motivate and encourage them

Be concise, helpful, and actionable. Use bullet points when listing items.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8), // keep last 8 messages for context
      { role: 'user', content: message },
    ];

    const reply = await callGroq(messages, 512);
    res.json({ success: true, reply });
  } catch (err) {
    console.error('AI chat error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 2. SMART TASK BREAKDOWN ───────────────────────────────────────────────────
// POST /api/ai/breakdown
// Body: { taskTitle, taskDesc }
router.post('/breakdown', async (req, res) => {
  try {
    const { taskTitle, taskDesc = '' } = req.body;
    if (!taskTitle) return res.status(400).json({ success: false, message: 'Task title required' });

    const prompt = `Break down this task into 3-7 clear, actionable subtasks.
Task: "${taskTitle}"
${taskDesc ? `Description: ${taskDesc}` : ''}

Respond with ONLY a JSON array of strings, no explanation, no markdown.
Example: ["Research options","Create outline","Write first draft","Review and edit","Final submission"]`;

    const reply = await callGroq([{ role: 'user', content: prompt }], 300);

    let subtasks = [];
    try {
      const clean = reply.replace(/```json|```/g, '').trim();
      subtasks = JSON.parse(clean);
    } catch {
      // fallback: split by newlines
      subtasks = reply.split('\n').filter(l => l.trim()).map(l => l.replace(/^[-•*\d.]\s*/,'').trim()).filter(Boolean);
    }

    res.json({ success: true, subtasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 3. DAILY PLAN GENERATOR ───────────────────────────────────────────────────
// POST /api/ai/daily-plan
router.post('/daily-plan', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await Task.find({ userId: req.user._id, completed: false, date: today });
    const allPending = await Task.find({ userId: req.user._id, completed: false }).limit(30);

    const taskList = allPending.map(t =>
      `- "${t.title}" [priority:${t.priority}, category:${t.category}, due:${t.date||'flexible'}, estimate:${t.estimate||'?'}min]`
    ).join('\n');

    const prompt = `You are a productivity coach. Create an optimized daily plan for today based on these tasks:

${taskList}

Today's date: ${today}
Today has ${tasks.length} scheduled tasks.

Create a structured daily schedule with:
1. Morning focus block (high priority tasks)
2. Afternoon work block
3. Evening wind-down tasks
4. 3 specific tips for today

Format as readable text with times and emojis. Keep it concise and motivating.`;

    const plan = await callGroq([{ role: 'user', content: prompt }], 600);
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 4. TASK PRIORITY ANALYZER ─────────────────────────────────────────────────
// POST /api/ai/prioritize
router.post('/prioritize', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id, completed: false }).limit(30);
    if (!tasks.length) return res.json({ success: true, analysis: 'No pending tasks to analyze!', suggestions: [] });

    const taskList = tasks.map((t, i) =>
      `${i+1}. "${t.title}" [current priority:${t.priority}, due:${t.date||'no date'}, category:${t.category}]`
    ).join('\n');

    const prompt = `Analyze these tasks and suggest priority reordering and focus areas.

Tasks:
${taskList}

Today: ${new Date().toISOString().split('T')[0]}

Respond with ONLY this JSON structure:
{
  "analysis": "2-3 sentence summary of what you see",
  "topFocus": ["task name 1", "task name 2", "task name 3"],
  "suggestions": [
    {"task": "task title", "suggestedPriority": "high|medium|low", "reason": "brief reason"}
  ],
  "tip": "one actionable productivity tip"
}`;

    const reply = await callGroq([{ role: 'user', content: prompt }], 600);
    let result;
    try {
      const clean = reply.replace(/```json|```/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      result = { analysis: reply, topFocus: [], suggestions: [], tip: '' };
    }
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 5. SMART TASK CREATION ────────────────────────────────────────────────────
// POST /api/ai/smart-create
// Body: { prompt } — natural language task description
router.post('/smart-create', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: 'Prompt required' });
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `Convert this natural language task description into a structured task object.
Today's date: ${today}

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "title": "clear task title",
  "desc": "brief description",
  "priority": "high|medium|low",
  "category": "Work|Personal|Health|Learning|Finance|Other",
  "date": "YYYY-MM-DD or empty string",
  "time": "HH:MM or empty string",
  "estimate": number_in_minutes_or_0,
  "tags": ["tag1","tag2"],
  "subtasks": [{"text":"subtask","done":false}],
  "reminder": 15
}`;

    const reply = await callGroq([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ], 400);

    let taskData;
    try {
      taskData = normalizeTaskData(extractJsonObject(reply), prompt);
    } catch {
      taskData = fallbackSmartCreate(prompt);
    }

    res.json({ success: true, task: taskData });
  } catch (err) {
    try {
      const { prompt } = req.body;
      if (prompt) return res.json({ success: true, task: fallbackSmartCreate(prompt) });
    } catch {
      // Return the original error if the fallback cannot build a task.
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 6. PRODUCTIVITY INSIGHTS ──────────────────────────────────────────────────
// GET /api/ai/insights
router.get('/insights', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).limit(50);
    const goals = await Goal.find({ userId: req.user._id });

    const total     = tasks.length;
    const done      = tasks.filter(t => t.completed).length;
    const high      = tasks.filter(t => t.priority === 'high' && !t.completed).length;
    const overdue   = tasks.filter(t => {
      if (!t.date || !t.time || t.completed) return false;
      return new Date(`${t.date}T${t.time}`) < new Date();
    }).length;
    const catCounts = {};
    tasks.forEach(t => { catCounts[t.category] = (catCounts[t.category]||0)+1; });
    const topCat    = Object.entries(catCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Work';

    const prompt = `Based on this productivity data, give personalized insights and recommendations.

Stats:
- Total tasks: ${total}
- Completed: ${done} (${total?Math.round(done/total*100):0}% completion rate)
- High priority pending: ${high}
- Overdue: ${overdue}
- Most active category: ${topCat}
- Active goals: ${goals.length}

Provide:
1. One key insight about their productivity pattern
2. Three specific, actionable recommendations
3. One motivational message

Keep it personal, encouraging, and concise. Use emojis.`;

    const insights = await callGroq([{ role: 'user', content: prompt }], 400);
    res.json({ success: true, insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
