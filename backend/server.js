const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── DATABASE ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/goals',     require('./routes/goals'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/stats',     require('./routes/stats'));
app.use('/api/ai',        require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// ─── CRON JOBS ────────────────────────────────────────────────────────────────
// Check reminders every minute
cron.schedule('* * * * *', async () => {
  try {
    const Task = require('./models/Task');
    const now = new Date();
    const fifteenMin = new Date(now.getTime() + 15 * 60 * 1000);
    const tasks = await Task.find({
      completed: false,
      reminderSent: false,
      date: { $exists: true },
      time: { $exists: true },
    }).populate('userId', 'email name');

    for (const task of tasks) {
      if (!task.date || !task.time) continue;
      const taskDT = new Date(`${task.date}T${task.time}`);
      const diffMin = Math.round((taskDT - now) / 60000);
      if (diffMin <= (task.reminder || 15) && diffMin >= 0) {
        task.reminderSent = true;
        await task.save();
        console.log(`🔔 Reminder: ${task.title} for user ${task.userId?.email}`);
        // Email sending would go here
      }
    }
  } catch (e) { /* silent */ }
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API running on http://localhost:${PORT}`);
});
