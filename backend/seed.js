const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Goal = require('./models/Goal');

async function seed() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/taskflow');
    console.log('Connected to MongoDB for seeding...');

    const user = await User.findOne({ email: 'demo@example.com' });
    if (!user) {
      console.error('User not found. Please register demo@example.com first.');
      process.exit(1);
    }

    const userId = user._id;

    // Clear existing data for this user to start fresh
    await Task.deleteMany({ userId });
    await Goal.deleteMany({ userId });

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Create a Goal
    const goal = await Goal.create({
      userId,
      title: 'Master Web Development',
      desc: 'Become a full-stack pro by completing projects.',
      category: 'Learning',
      target: 5,
      current: 2,
      date: '2026-12-31'
    });

    const healthGoal = await Goal.create({
      userId,
      title: 'Personal Health & Wellness',
      desc: 'Focus on physical and mental well-being.',
      category: 'Health',
      target: 30,
      current: 12,
      date: '2026-06-30'
    });

    const placementGoal = await Goal.create({
      userId,
      title: 'Ace Placement Season',
      desc: 'Prepare for top-tier software engineering roles.',
      category: 'Learning',
      target: 100,
      current: 45,
      date: '2026-09-15'
    });

    // Create Tasks
    await Task.create([
      {
        userId,
        title: 'Daily Morning Yoga',
        desc: '15 minutes of sun salutations.',
        priority: 'medium',
        category: 'Health',
        status: 'todo',
        pinned: true,
        recurring: 'daily',
        tags: ['wellness', 'habit'],
        color: '#ff9ff3'
      },
      {
        userId,
        title: 'Complete Frontend Components',
        desc: 'Build reusable UI components for the dashboard.',
        priority: 'high',
        category: 'Work',
        status: 'inprogress',
        progress: 60,
        goalId: goal._id,
        subtasks: [
          { text: 'Header with user profile', done: true },
          { text: 'Dynamic sidebar navigation', done: true },
          { text: 'Task filter system', done: false }
        ]
      },
      {
        userId,
        title: 'Critical Server Migration',
        desc: 'Move database to new cloud region.',
        priority: 'high',
        category: 'Work',
        status: 'todo',
        tags: ['infrastructure', 'urgent', 'devops'],
        color: '#ee5253'
      },
      {
        userId,
        title: 'Doctor Appointment',
        desc: 'Routine check-up.',
        priority: 'medium',
        category: 'Health',
        status: 'todo',
        date: tomorrow,
        time: '14:30',
        reminder: 30,
        goalId: healthGoal._id
      },
      {
        userId,
        title: 'Submit Monthly Report',
        desc: 'Financial summary for April.',
        priority: 'medium',
        category: 'Work',
        status: 'review',
        date: yesterday,
        time: '17:00'
      },
      {
        userId,
        title: 'Annual Insurance Payment',
        desc: 'Renew health insurance policy.',
        priority: 'high',
        category: 'Finance',
        status: 'inprogress',
        progress: 20,
        tags: ['important', 'bill']
      },
      {
        userId,
        title: 'Solve 5 LeetCode Problems',
        desc: 'Topic: Dynamic Programming and Graphs.',
        priority: 'high',
        category: 'Learning',
        status: 'todo',
        pinned: true,
        goalId: placementGoal._id,
        tags: ['dsa', 'coding', 'placement']
      },
      {
        userId,
        title: 'OS Lab: Bankers Algorithm',
        desc: 'Implement and test the deadlock avoidance algorithm.',
        priority: 'medium',
        category: 'Work',
        status: 'inprogress',
        progress: 40,
        subtasks: [
          { text: 'Write C++ implementation', done: true },
          { text: 'Create test cases', done: false },
          { text: 'Write lab report', done: false }
        ]
      },
      {
        userId,
        title: 'DBMS Final Project Report',
        desc: 'Submit the E-commerce database design documentation.',
        priority: 'high',
        category: 'Work',
        status: 'todo',
        date: tomorrow,
        time: '23:59',
        tags: ['academics', 'project']
      },
      {
        userId,
        title: 'Learn Docker & Kubernetes',
        desc: 'Watch tutorials on containerization and orchestration.',
        priority: 'medium',
        category: 'Learning',
        status: 'inprogress',
        progress: 15,
        goalId: placementGoal._id
      },
      {
        userId,
        title: 'Update LinkedIn & Portfolio',
        desc: 'Add recent projects and skills to professional profiles.',
        priority: 'medium',
        category: 'Personal',
        status: 'todo',
        tags: ['career', 'branding']
      },
      {
        userId,
        title: 'Weekly Team Sync',
        desc: 'Discuss project progress and blockers.',
        priority: 'medium',
        category: 'Work',
        status: 'todo',
        pinned: true,
        recurring: 'weekly',
        time: '10:00',
        tags: ['meeting', 'team'],
        color: '#686de0'
      },
      {
        userId,
        title: 'Pay Internet Bill',
        desc: 'Monthly subscription renewal.',
        priority: 'high',
        category: 'Finance',
        status: 'todo',
        recurring: 'monthly',
        date: today,
        time: '09:00',
        reminder: 60,
        color: '#4834d4'
      },
      {
        userId,
        title: 'Deep Work: AI Feature',
        desc: 'Implement the core AI recommendation engine.',
        priority: 'high',
        category: 'Work',
        status: 'inprogress',
        progress: 35,
        goalId: goal._id,
        subtasks: [
          { text: 'Setup Gemini API client', done: true },
          { text: 'Design prompt templates', done: true },
          { text: 'Implement task analysis logic', done: false },
          { text: 'Connect to frontend UI', done: false },
          { text: 'Unit testing', done: false }
        ],
        tags: ['coding', 'ai']
      },
      {
        userId,
        title: 'Stock up on Groceries',
        desc: 'Weekly food supplies.',
        priority: 'low',
        category: 'Personal',
        status: 'done',
        completed: true,
        progress: 100,
        tags: ['home', 'shopping'],
        color: '#badc58'
      },
      {
        userId,
        title: 'Late Night Coding',
        desc: 'Work on personal side project.',
        priority: 'medium',
        category: 'Learning',
        status: 'review',
        date: today,
        time: '23:00',
        reminder: 10
      },
      {
        userId,
        title: 'Learn React Hooks',
        desc: 'Deep dive into useEffect and useMemo.',
        priority: 'medium',
        category: 'Learning',
        status: 'done',
        progress: 100,
        completed: true,
        goalId: goal._id
      }
    ]);

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
