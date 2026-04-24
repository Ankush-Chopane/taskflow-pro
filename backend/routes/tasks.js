const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

router.use(protect);

// @GET /api/tasks  — get all tasks (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, priority, category, date, completed, pinned, search } = req.query;
    const filter = { userId: req.user._id };
    if (status)    filter.status = status;
    if (priority)  filter.priority = priority;
    if (category)  filter.category = category;
    if (date)      filter.date = date;
    if (completed !== undefined) filter.completed = completed === 'true';
    if (pinned !== undefined)    filter.pinned = pinned === 'true';
    if (search)    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { desc:  { $regex: search, $options: 'i' } },
      { tags:  { $in: [new RegExp(search, 'i')] } },
    ];

    const tasks = await Task.find(filter).sort({ pinned: -1, createdAt: -1 });
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/tasks/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = await Task.find({ userId: req.user._id, date: today }).sort({ pinned: -1, time: 1 });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/tasks/overdue
router.get('/overdue', async (req, res) => {
  try {
    const now = new Date();
    const tasks = await Task.find({ userId: req.user._id, completed: false });
    const overdue = tasks.filter(t => {
      if (!t.date || !t.time) return false;
      return new Date(`${t.date}T${t.time}`) < now;
    });
    res.json({ success: true, tasks: overdue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };
    // Sanitize goalId — convert empty string to null
    if (body.goalId === '' || body.goalId === undefined) body.goalId = null;
    // Sanitize time — convert 12h format if needed
    if (body.time && body.time.includes('AM') || body.time && body.time.includes('PM')) {
      // convert to 24h
      const [t, ampm] = body.time.split(' ');
      let [h, m] = t.split(':');
      h = parseInt(h);
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      body.time = `${String(h).padStart(2,'0')}:${m}`;
    }
    const task = await Task.create({ ...body, userId: req.user._id });
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.goalId === '' || body.goalId === undefined) body.goalId = null;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      body,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// @PATCH /api/tasks/:id/complete — toggle complete
router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    task.completed = !task.completed;
    task.status = task.completed ? 'done' : (task.status === 'done' ? 'todo' : task.status);
    if (task.completed) task.progress = 100;
    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @PATCH /api/tasks/:id/subtask/:subId — toggle subtask
router.patch('/:id/subtask/:subId', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const sub = task.subtasks.id(req.params.subId);
    if (!sub) return res.status(404).json({ success: false, message: 'Subtask not found' });
    sub.done = !sub.done;
    await task.save();
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/tasks — delete all completed
router.delete('/batch/completed', async (req, res) => {
  try {
    const result = await Task.deleteMany({ userId: req.user._id, completed: true });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
