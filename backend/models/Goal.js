const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true },
  desc: { type: String, default: '' },
  category: {
    type: String,
    enum: ['Work', 'Health', 'Learning', 'Finance', 'Personal'],
    default: 'Work',
  },
  target: { type: Number, required: true, min: 1 },
  current: { type: Number, default: 0 },
  date: { type: String, default: '' },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
