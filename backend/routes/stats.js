const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
router.use(protect);

// @GET /api/stats/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const uid = req.user._id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    const [all, done, todayTasks] = await Promise.all([
      Task.countDocuments({ userId: uid }),
      Task.countDocuments({ userId: uid, completed: true }),
      Task.find({ userId: uid, date: today }),
    ]);

    const todayDone = todayTasks.filter(t => t.completed).length;
    const rate = todayTasks.length ? Math.round(todayDone / todayTasks.length * 100) : 0;

    // Overdue
    const allPending = await Task.find({ userId: uid, completed: false });
    const overdue = allPending.filter(t => {
      if (!t.date || !t.time) return false;
      return new Date(`${t.date}T${t.time}`) < now;
    }).length;

    // Priority counts (incomplete)
    const high   = await Task.countDocuments({ userId: uid, priority: 'high',   completed: false });
    const medium = await Task.countDocuments({ userId: uid, priority: 'medium', completed: false });
    const low    = await Task.countDocuments({ userId: uid, priority: 'low',    completed: false });

    // Weekly (last 7 days)
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const count = await Task.countDocuments({ userId: uid, date: ds, completed: true });
      weekly.push({ date: ds, day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()], count });
    }

    res.json({ success: true, stats: { total: all, done, todayTotal: todayTasks.length, todayDone, rate, overdue, priorities: { high, medium, low }, weekly } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
