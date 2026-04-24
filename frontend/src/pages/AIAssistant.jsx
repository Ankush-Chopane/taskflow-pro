import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../utils/aiApi';
import { useTask } from '../context/TaskContext';
import TaskModal from '../components/TaskModal';
import toast from 'react-hot-toast';

// ─── STYLES (inline for single file) ─────────────────────────────────────────
const S = {
  page:        { display:'flex', flexDirection:'column', gap:20, animation:'fadeUp .3s ease' },
  tabs:        { display:'flex', gap:4, background:'var(--s2)', borderRadius:12, padding:4, border:'1px solid var(--border)', flexWrap:'wrap' },
  tab:         { flex:1, minWidth:100, padding:'8px 14px', borderRadius:9, fontFamily:'inherit', fontSize:'.82rem', fontWeight:600, cursor:'pointer', background:'none', border:'none', color:'var(--t2)', transition:'all .2s' },
  tabA:        { background:'var(--s3)', color:'var(--text)' },
  grid2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  card:        { background:'var(--s1)', border:'1px solid var(--border)', borderRadius:16, padding:20, display:'flex', flexDirection:'column', gap:14 },
  cardTitle:   { fontFamily:"'Clash Display',sans-serif", fontSize:'.95rem', fontWeight:600, display:'flex', alignItems:'center', gap:8 },
  label:       { fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'var(--t2)', marginBottom:6, display:'block' },
  input:       { width:'100%', background:'var(--s2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 13px', color:'var(--text)', fontSize:'.87rem', outline:'none', fontFamily:'inherit', transition:'border-color .2s' },
  textarea:    { width:'100%', background:'var(--s2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 13px', color:'var(--text)', fontSize:'.87rem', outline:'none', fontFamily:'inherit', resize:'vertical', minHeight:80, lineHeight:1.5 },
  btnPrimary:  { padding:'9px 20px', borderRadius:10, background:'linear-gradient(135deg,var(--a1),#8b7fff)', color:'white', border:'none', fontFamily:'inherit', fontSize:'.83rem', fontWeight:700, cursor:'pointer', transition:'all .2s', boxShadow:'0 4px 14px rgba(108,99,255,.3)', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' },
  btnGhost:    { padding:'8px 16px', borderRadius:10, background:'var(--s2)', border:'1px solid var(--border)', color:'var(--t2)', fontFamily:'inherit', fontSize:'.82rem', fontWeight:600, cursor:'pointer', transition:'all .2s' },
  badge:       (color) => ({ fontSize:'.68rem', fontWeight:700, padding:'2px 9px', borderRadius:20, background:`${color}22`, color, textTransform:'uppercase', letterSpacing:'.05em' }),
  spin:        { animation:'spin 1s linear infinite', display:'inline-block' },
};

const QUICK_PROMPTS = [
  "What should I focus on today?",
  "Help me plan my week",
  "I'm feeling overwhelmed, what should I do first?",
  "How can I improve my productivity?",
  "Which tasks are most urgent?",
];

// ─── CHAT TAB ─────────────────────────────────────────────────────────────────
function ChatTab() {
  const [messages, setMessages] = useState([
    { role:'assistant', content:"Hi! 👋 I'm your TaskFlow AI. I can see your tasks and help you plan, prioritize, and stay productive. What can I help you with today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages = [...messages, { role:'user', content:msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.slice(1).map(m => ({ role:m.role, content:m.content }));
      const r = await aiAPI.chat(msg, history.slice(0,-1));
      setMessages(prev => [...prev, { role:'assistant', content:r.data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role:'assistant', content:"Sorry, I couldn't connect to the AI. Please check your Gemini API key in the backend .env file." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 280px)', minHeight:480 }}>
      {/* Quick prompts */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => send(p)} style={{ padding:'5px 13px', borderRadius:20, background:'var(--s2)', border:'1px solid var(--border)', color:'var(--t2)', fontSize:'.75rem', cursor:'pointer', fontFamily:'inherit', transition:'all .2s', whiteSpace:'nowrap' }}
            onMouseEnter={e=>{e.target.style.borderColor='var(--a1)';e.target.style.color='var(--a1)';}}
            onMouseLeave={e=>{e.target.style.borderColor='var(--border)';e.target.style.color='var(--t2)';}}>
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12, padding:'4px 2px', marginBottom:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', flexDirection: m.role==='user' ? 'row-reverse' : 'row' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.85rem', background: m.role==='user' ? 'linear-gradient(135deg,var(--a1),var(--a2))' : 'linear-gradient(135deg,#1c1c2e,#2a2a40)', border:'1px solid var(--border)' }}>
              {m.role==='user' ? '👤' : '✦'}
            </div>
            <div style={{ maxWidth:'78%', background: m.role==='user' ? 'rgba(108,99,255,.15)' : 'var(--s2)', border:`1px solid ${m.role==='user'?'rgba(108,99,255,.3)':'var(--border)'}`, borderRadius: m.role==='user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', padding:'11px 14px', fontSize:'.87rem', lineHeight:1.6, whiteSpace:'pre-wrap', wordBreak:'break-word', color:'var(--text)' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1c1c2e,#2a2a40)', border:'1px solid var(--border)' }}>✦</div>
            <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:'4px 16px 16px 16px', padding:'11px 14px' }}>
              <span style={S.spin}>⟳</span> Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display:'flex', gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())}
          placeholder="Ask about your tasks, planning, productivity..." style={{ ...S.input, flex:1 }}
          disabled={loading} />
        <button onClick={()=>send()} style={S.btnPrimary} disabled={loading}>
          {loading ? '...' : 'Send ➤'}
        </button>
      </div>
    </div>
  );
}

// ─── SMART CREATE TAB ─────────────────────────────────────────────────────────
function SmartCreateTab() {
  const { createTask } = useTask();
  const [prompt, setPrompt]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask]   = useState(null);

  const EXAMPLES = [
    "Call dentist tomorrow at 3pm, high priority",
    "Finish the quarterly report by Friday, work category",
    "Go for a 30 minute run every morning this week",
    "Read chapter 5 of Atomic Habits tonight",
    "Pay credit card bill before the 25th",
  ];

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await aiAPI.smartCreate(prompt);
      setResult(r.data.task);
    } catch (e) { toast.error('AI could not parse that. Try being more specific.'); }
    setLoading(false);
  };

  const createDirect = async () => {
    if (!result) return;
    await createTask({ ...result, status:'todo', completed:false, pinned:false });
    setResult(null);
    setPrompt('');
  };

  const editAndCreate = () => {
    setEditTask(result);
    setShowModal(true);
  };

  const P_COLOR = { high:'var(--high)', medium:'var(--med)', low:'var(--low)' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'rgba(108,99,255,.08)', border:'1px solid rgba(108,99,255,.2)', borderRadius:12, padding:14 }}>
        <p style={{ fontSize:'.83rem', color:'var(--t2)', lineHeight:1.6 }}>
          ✨ <strong style={{color:'var(--text)'}}>Smart Create</strong> — Describe your task in plain English and TaskFlow AI will automatically fill in the title, priority, category, due date, time, subtasks, and tags.
        </p>
      </div>

      <div>
        <label style={S.label}>Describe your task in natural language</label>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
          placeholder="e.g. Submit project report to my manager by Friday 5pm, its urgent, work category"
          style={{ ...S.textarea, minHeight:90 }} />
        <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={()=>setPrompt(ex)}
              style={{ padding:'4px 11px', borderRadius:20, background:'var(--s2)', border:'1px solid var(--border)', color:'var(--t3)', fontSize:'.72rem', cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}
              onMouseEnter={e=>{e.target.style.color='var(--a1)';e.target.style.borderColor='var(--a1)';}}
              onMouseLeave={e=>{e.target.style.color='var(--t3)';e.target.style.borderColor='var(--border)';}}>
              {ex}
            </button>
          ))}
        </div>
      </div>

      <button onClick={generate} style={S.btnPrimary} disabled={loading}>
        {loading ? <><span style={S.spin}>⟳</span> Generating...</> : '✨ Generate Task with AI'}
      </button>

      {result && (
        <div style={{ background:'var(--s2)', border:'1px solid var(--border2)', borderRadius:14, padding:18, animation:'fadeUp .3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <span style={{ fontSize:'.75rem', color:'var(--a3)', fontWeight:700 }}>✓ AI GENERATED TASK</span>
          </div>
          <div style={{ fontFamily:"'Clash Display',sans-serif", fontSize:'1.1rem', fontWeight:700, marginBottom:10 }}>{result.title}</div>
          {result.desc && <p style={{ fontSize:'.83rem', color:'var(--t2)', marginBottom:12, lineHeight:1.5 }}>{result.desc}</p>}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
            {[
              ['Priority', result.priority, P_COLOR[result.priority]||'var(--t2)'],
              ['Category', result.category, 'var(--a1)'],
              ['Estimate', result.estimate ? result.estimate+'m' : 'None', 'var(--a4)'],
            ].map(([k,v,c]) => (
              <div key={k} style={{ background:'var(--s3)', borderRadius:8, padding:'9px 12px' }}>
                <div style={{ fontSize:'.65rem', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:3 }}>{k}</div>
                <div style={{ fontSize:'.85rem', fontWeight:700, color:c }}>{v}</div>
              </div>
            ))}
          </div>

          {(result.date||result.time) && (
            <div style={{ fontSize:'.83rem', color:'var(--t2)', marginBottom:10 }}>
              📅 {result.date} {result.time}
            </div>
          )}

          {result.tags?.length > 0 && (
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:12 }}>
              {result.tags.map(t => <span key={t} style={{ ...S.badge('var(--a1)') }}>{t}</span>)}
            </div>
          )}

          {result.subtasks?.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:'.75rem', color:'var(--t3)', marginBottom:6, fontWeight:700, textTransform:'uppercase' }}>Subtasks</div>
              {result.subtasks.map((s,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', fontSize:'.83rem', color:'var(--t2)', borderBottom:'1px solid var(--border)' }}>
                  <span>☐</span>{s.text}
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button onClick={createDirect} style={S.btnPrimary}>✓ Create Task</button>
            <button onClick={editAndCreate} style={S.btnGhost}>✏️ Edit First</button>
            <button onClick={()=>setResult(null)} style={{ ...S.btnGhost, marginLeft:'auto' }}>✕ Discard</button>
          </div>
        </div>
      )}

      {showModal && <TaskModal task={editTask} onClose={()=>{setShowModal(false);setResult(null);setPrompt('');}} />}
    </div>
  );
}

// ─── DAILY PLAN TAB ───────────────────────────────────────────────────────────
function DailyPlanTab() {
  const [plan, setPlan]       = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setPlan('');
    try {
      const r = await aiAPI.dailyPlan();
      setPlan(r.data.plan);
    } catch (e) { toast.error('Failed to generate plan'); }
    setLoading(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'rgba(0,229,192,.06)', border:'1px solid rgba(0,229,192,.15)', borderRadius:12, padding:14 }}>
        <p style={{ fontSize:'.83rem', color:'var(--t2)', lineHeight:1.6 }}>
          📅 <strong style={{color:'var(--text)'}}>Daily Plan</strong> — Our AI analyzes all your pending tasks and creates an optimized schedule for your day with time blocks and tips.
        </p>
      </div>
      <button onClick={generate} style={{ ...S.btnPrimary, background:'linear-gradient(135deg,var(--a3),#00b894)', boxShadow:'0 4px 14px rgba(0,229,192,.25)' }} disabled={loading}>
        {loading ? <><span style={S.spin}>⟳</span> Analyzing tasks...</> : '📅 Generate Today\'s Plan'}
      </button>
      {plan && (
        <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:14, padding:20, whiteSpace:'pre-wrap', lineHeight:1.8, fontSize:'.87rem', animation:'fadeUp .3s ease' }}>
          {plan}
        </div>
      )}
    </div>
  );
}

// ─── PRIORITIZE TAB ───────────────────────────────────────────────────────────
function PrioritizeTab() {
  const { updateTask, tasks } = useTask();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setData(null);
    try {
      const r = await aiAPI.prioritize();
      setData(r.data);
    } catch (e) { toast.error('Analysis failed'); }
    setLoading(false);
  };

  const applyPriority = async (taskTitle, priority) => {
    const t = tasks.find(x => x.title === taskTitle);
    if (!t) return;
    await updateTask(t._id, { priority });
    toast.success(`Updated "${taskTitle}" to ${priority} priority`);
  };

  const P_COLOR = { high:'var(--high)', medium:'var(--med)', low:'var(--low)' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'rgba(255,184,48,.06)', border:'1px solid rgba(255,184,48,.15)', borderRadius:12, padding:14 }}>
        <p style={{ fontSize:'.83rem', color:'var(--t2)', lineHeight:1.6 }}>
          🧠 <strong style={{color:'var(--text)'}}>AI Prioritizer</strong> — TaskFlow AI analyzes all your tasks by due dates, importance, and categories to suggest an optimal priority order and what to focus on.
        </p>
      </div>
      <button onClick={analyze} style={{ ...S.btnPrimary, background:'linear-gradient(135deg,var(--a4),#e17055)', boxShadow:'0 4px 14px rgba(255,184,48,.25)' }} disabled={loading}>
        {loading ? <><span style={S.spin}>⟳</span> Analyzing...</> : '🧠 Analyze & Prioritize Tasks'}
      </button>

      {data && (
        <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'fadeUp .3s ease' }}>
          {/* Analysis */}
          <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:'.75rem', color:'var(--a4)', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>📊 Analysis</div>
            <p style={{ fontSize:'.87rem', lineHeight:1.6, color:'var(--text)' }}>{data.analysis}</p>
          </div>

          {/* Top focus */}
          {data.topFocus?.length > 0 && (
            <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
              <div style={{ fontSize:'.75rem', color:'var(--high)', fontWeight:700, textTransform:'uppercase', marginBottom:10 }}>🎯 Top 3 Focus Areas</div>
              {data.topFocus.map((t,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ width:22, height:22, borderRadius:'50%', background:'linear-gradient(135deg,var(--a1),var(--a2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.72rem', fontWeight:700, flexShrink:0, color:'white' }}>{i+1}</span>
                  <span style={{ fontSize:'.87rem', fontWeight:600 }}>{t}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {data.suggestions?.length > 0 && (
            <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:12, padding:16 }}>
              <div style={{ fontSize:'.75rem', color:'var(--a1)', fontWeight:700, textTransform:'uppercase', marginBottom:10 }}>💡 Priority Suggestions</div>
              {data.suggestions.map((s,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'.85rem', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.task}</div>
                    <div style={{ fontSize:'.75rem', color:'var(--t2)', marginTop:2 }}>{s.reason}</div>
                  </div>
                  <span style={S.badge(P_COLOR[s.suggestedPriority]||'var(--t2)')}>{s.suggestedPriority}</span>
                  <button onClick={()=>applyPriority(s.task, s.suggestedPriority)}
                    style={{ padding:'4px 10px', borderRadius:7, background:'rgba(108,99,255,.15)', border:'1px solid rgba(108,99,255,.3)', color:'var(--a1)', fontSize:'.72rem', cursor:'pointer', fontFamily:'inherit', fontWeight:700, flexShrink:0 }}>
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tip */}
          {data.tip && (
            <div style={{ background:'rgba(108,99,255,.08)', border:'1px solid rgba(108,99,255,.2)', borderRadius:12, padding:14, fontSize:'.85rem', lineHeight:1.6, color:'var(--t2)' }}>
              💡 <strong style={{color:'var(--text)'}}>Tip:</strong> {data.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── INSIGHTS TAB ─────────────────────────────────────────────────────────────
function InsightsTab() {
  const [insights, setInsights] = useState('');
  const [loading, setLoading]   = useState(false);
  const { stats } = useTask();

  const generate = async () => {
    setLoading(true);
    setInsights('');
    try {
      const r = await aiAPI.insights();
      setInsights(r.data.insights);
    } catch (e) { toast.error('Failed to load insights'); }
    setLoading(false);
  };

  useEffect(() => { generate(); }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Quick stats */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            ['Total Tasks',    stats.total,     'var(--a1)'],
            ['Completed',      stats.done,      'var(--a3)'],
            ['Today',          stats.todayTotal,'var(--a4)'],
            ['Overdue',        stats.overdue,   'var(--high)'],
          ].map(([l,v,c]) => (
            <div key={l} style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Clash Display',sans-serif", fontSize:'1.8rem', fontWeight:700, color:c, lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:'.7rem', color:'var(--t2)', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontFamily:"'Clash Display',sans-serif", fontSize:'.95rem', fontWeight:600 }}>🔍 AI Productivity Insights</span>
        <button onClick={generate} style={{ ...S.btnGhost, marginLeft:'auto', fontSize:'.78rem', padding:'6px 14px' }} disabled={loading}>
          {loading ? '⟳ Refreshing...' : '↺ Refresh'}
        </button>
      </div>

      {loading && !insights && (
        <div style={{ textAlign:'center', padding:40, color:'var(--t2)' }}>
          <div style={{ ...S.spin, fontSize:'2rem', display:'block', marginBottom:12 }}>⟳</div>
          Analyzing your productivity data...
        </div>
      )}

      {insights && (
        <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:14, padding:20, whiteSpace:'pre-wrap', lineHeight:1.85, fontSize:'.87rem', animation:'fadeUp .3s ease' }}>
          {insights}
        </div>
      )}
    </div>
  );
}

// ─── BREAKDOWN TAB ────────────────────────────────────────────────────────────
function BreakdownTab() {
  const { tasks, updateTask } = useTask();
  const [selectedTask, setSelectedTask] = useState('');
  const [subtasks, setSubtasks]         = useState([]);
  const [loading, setLoading]           = useState(false);

  const activeTasks = tasks.filter(t => !t.completed);

  const generate = async () => {
    if (!selectedTask) return;
    const t = tasks.find(x => x._id === selectedTask);
    if (!t) return;
    setLoading(true);
    setSubtasks([]);
    try {
      const r = await aiAPI.breakdown(t.title, t.desc);
      setSubtasks(r.data.subtasks);
    } catch (e) { toast.error('Breakdown failed'); }
    setLoading(false);
  };

  const apply = async () => {
    const t = tasks.find(x => x._id === selectedTask);
    if (!t) return;
    const newSubs = subtasks.map(s => ({ text:s, done:false }));
    await updateTask(t._id, { subtasks: [...(t.subtasks||[]), ...newSubs] });
    toast.success(`Added ${newSubs.length} subtasks!`);
    setSubtasks([]);
    setSelectedTask('');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'rgba(255,92,168,.06)', border:'1px solid rgba(255,92,168,.15)', borderRadius:12, padding:14 }}>
        <p style={{ fontSize:'.83rem', color:'var(--t2)', lineHeight:1.6 }}>
          🔨 <strong style={{color:'var(--text)'}}>Task Breakdown</strong> — Select any task and TaskFlow AI will break it down into clear, actionable subtasks that you can add directly to the task.
        </p>
      </div>

      <div>
        <label style={S.label}>Select a task to break down</label>
        <select value={selectedTask} onChange={e=>setSelectedTask(e.target.value)} style={{ ...S.input }}>
          <option value="">— Choose a task —</option>
          {activeTasks.map(t => (
            <option key={t._id} value={t._id}>{t.title}</option>
          ))}
        </select>
      </div>

      <button onClick={generate} style={{ ...S.btnPrimary, background:'linear-gradient(135deg,var(--a2),#fd79a8)', boxShadow:'0 4px 14px rgba(255,92,168,.25)' }} disabled={loading||!selectedTask}>
        {loading ? <><span style={S.spin}>⟳</span> Breaking down...</> : '🔨 Break Down Task with AI'}
      </button>

      {subtasks.length > 0 && (
        <div style={{ background:'var(--s2)', border:'1px solid var(--border)', borderRadius:14, padding:18, animation:'fadeUp .3s ease' }}>
          <div style={{ fontSize:'.75rem', color:'var(--a2)', fontWeight:700, textTransform:'uppercase', marginBottom:12 }}>
            AI Generated Subtasks ({subtasks.length})
          </div>
          {subtasks.map((s,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid var(--border)', fontSize:'.87rem' }}>
              <span style={{ width:20, height:20, borderRadius:5, border:'2px solid var(--border2)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', color:'var(--t3)' }}>{i+1}</span>
              {s}
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button onClick={apply} style={S.btnPrimary}>✓ Add to Task</button>
            <button onClick={()=>setSubtasks([])} style={S.btnGhost}>✕ Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN AI PAGE ─────────────────────────────────────────────────────────────
const AI_TABS = [
  { key:'chat',      label:'💬 Chat',         desc:'Ask anything' },
  { key:'create',    label:'✨ Smart Create',  desc:'Natural language' },
  { key:'plan',      label:'📅 Daily Plan',    desc:'AI schedule' },
  { key:'prioritize',label:'🧠 Prioritizer',   desc:'Smart sorting' },
  { key:'breakdown', label:'🔨 Breakdown',     desc:'Subtask gen' },
  { key:'insights',  label:'🔍 Insights',      desc:'Productivity' },
];

export default function AIAssistant() {
  const [tab, setTab] = useState('chat');

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ background:'var(--s1)', border:'1px solid var(--border)', borderRadius:16, padding:20, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,var(--a1),var(--a2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', boxShadow:'0 0 24px rgba(108,99,255,.4)', flexShrink:0 }}>✦</div>
        <div>
          <h2 style={{ fontFamily:"'Clash Display',sans-serif", fontSize:'1.2rem', fontWeight:700, marginBottom:4 }}>TaskFlow AI</h2>
          <p style={{ fontSize:'.83rem', color:'var(--t2)', lineHeight:1.5 }}>Your intelligent productivity assistant. Chat, auto-create tasks, generate daily plans, analyze priorities, and get personalized insights.</p>
        </div>
        <div style={{ marginLeft:'auto', ...S.badge('var(--a3)'), fontSize:'.72rem', padding:'4px 12px' }}>Gemini 1.5 Pro</div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {AI_TABS.map(t => (
          <button key={t.key} style={{ ...S.tab, ...(tab===t.key?S.tabA:{}) }} onClick={()=>setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background:'var(--s1)', border:'1px solid var(--border)', borderRadius:16, padding:22 }}>
        {tab === 'chat'       && <ChatTab />}
        {tab === 'create'     && <SmartCreateTab />}
        {tab === 'plan'       && <DailyPlanTab />}
        {tab === 'prioritize' && <PrioritizeTab />}
        {tab === 'breakdown'  && <BreakdownTab />}
        {tab === 'insights'   && <InsightsTab />}
      </div>
    </div>
  );
}
