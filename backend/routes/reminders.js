const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
router.use(protect);

// @GET /api/reminders — upcoming tasks with reminders
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const tasks = await Task.find({
      userId: req.user._id,
      completed: false,
      date: { $exists: true, $ne: '' },
    }).sort({ date: 1, time: 1 });

    const upcoming = tasks.filter(t => {
      if (!t.date || !t.time) return false;
      const dt = new Date(`${t.date}T${t.time}`);
      return dt >= new Date(now.getTime() - 3600000); // within past hour to future
    });

    res.json({ success: true, reminders: upcoming });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
