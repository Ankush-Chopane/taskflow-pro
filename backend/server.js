const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'http://localhost:3000']
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── DATABASE ─────────────────────────────────────────────────────────────────
console.log('🔍 Attempting MongoDB connection...');
console.log('📌 MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('📌 NODE_ENV:', process.env.NODE_ENV);

if (!process.env.MONGO_URI) {
  console.error('❌ CRITICAL: MONGO_URI not set in environment variables!');
  console.error('❌ Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('URI')));
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('📍 Connected to:', process.env.MONGO_URI.replace(/:[^:]*@/, ':****@'));
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    console.error('❌ Full error:', err);
  });

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

// Startup diagnostics
console.log('\n🔧 ═════════════════════════════════════════════════════════════');
console.log('📋 ENVIRONMENT VARIABLES CHECK:');
console.log(`✔ MONGO_URI: ${process.env.MONGO_URI ? '✅ SET' : '❌ MISSING'}`);
console.log(`✔ JWT_SECRET: ${process.env.JWT_SECRET ? '✅ SET' : '❌ MISSING'}`);
console.log(`✔ GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅ SET' : '❌ MISSING'}`);
console.log(`✔ NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`✔ PORT: ${PORT}`);
console.log('🔧 ═════════════════════════════════════════════════════════════\n');

app.listen(PORT, () => {
  console.log(`🚀 TaskFlow API running on http://localhost:${PORT}`);
});
