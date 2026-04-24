const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Goal = require('./models/Goal');

async function inspect() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/taskflow');
    console.log('--- MONGODB INSPECTION (taskflow database) ---');

    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();
    const goalCount = await Goal.countDocuments();

    console.log(`\n📊 Collections Summary:`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Tasks: ${taskCount}`);
    console.log(`- Goals: ${goalCount}`);

    console.log(`\n👤 Registered Users:`);
    const users = await User.find({}, 'name email');
    users.forEach(u => console.log(`  - ${u.name} (${u.email})`));

    console.log(`\n📋 Recent Tasks:`);
    const tasks = await Task.find({}).sort({ createdAt: -1 }).limit(5);
    tasks.forEach(t => console.log(`  - [${t.status}] ${t.title} (${t.category})`));

    console.log(`\n🎯 Active Goals:`);
    const goals = await Goal.find({});
    goals.forEach(g => console.log(`  - ${g.title} (${g.current}/${g.target})`));

    console.log('\n----------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Inspection failed:', err);
    process.exit(1);
  }
}

inspect();
