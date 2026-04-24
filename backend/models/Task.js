const mongoose = require('mongoose');

// ─── SUBTASK SCHEMA ─────────────────────────────
const SubtaskSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
});

// ─── TASK SCHEMA ───────────────────────────────
const TaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200,
  },

  desc: {
    type: String,
    default: '',
    maxlength: 2000,
  },

  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },

  category: {
    type: String,
    enum: ['Work', 'Personal', 'Health', 'Learning', 'Finance', 'Other'],
    default: 'Work',
  },

  status: {
    type: String,
    enum: ['todo', 'inprogress', 'review', 'done'],
    default: 'todo',
  },

  // ⚠️ Keeping STRING for compatibility with your current routes
  date: {
    type: String,
    default: '',
  },

  time: {
    type: String,
    default: '',
  },

  reminder: {
    type: Number,
    default: 15,
  },

  estimate: {
    type: Number,
    default: 0,
  },

  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },

  tags: {
    type: [String],
    default: [],
  },

  color: {
    type: String,
    default: '#6c63ff',
  },

  subtasks: {
    type: [SubtaskSchema],
    default: [],
  },

  notes: {
    type: String,
    default: '',
  },

  recurring: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none',
  },

  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
    set: v => (v ? v : null),
  },

  completed: {
    type: Boolean,
    default: false,
  },

  pinned: {
    type: Boolean,
    default: false,
  },

  reminderSent: {
    type: Boolean,
    default: false,
  },

}, { timestamps: true });


// ─── AUTO LOGIC ───────────────────────────────

// Auto mark as completed if progress = 100
TaskSchema.pre('save', function (next) {
  if (this.progress === 100) {
    this.completed = true;
    this.status = 'done';
  }
  next();
});


// ─── INDEXES ──────────────────────────────────
TaskSchema.index({ userId: 1, date: 1 });
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, completed: 1 });


// ─── EXPORT ───────────────────────────────────
module.exports = mongoose.model('Task', TaskSchema);