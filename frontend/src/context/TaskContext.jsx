import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { tasksAPI, goalsAPI, statsAPI, remindersAPI } from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks,     setTasks]     = useState([]);
  const [goals,     setGoals]     = useState([]);
  const [stats,     setStats]     = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [activity,  setActivity]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('tf_activity') || '[]'); } catch { return []; }
  });

  const saveActivity = (list) => {
    setActivity(list);
    localStorage.setItem('tf_activity', JSON.stringify(list.slice(0, 50)));
  };
  const addActivity = (type, text) => {
    saveActivity([{ type, text, time: Date.now() }, ...activity].slice(0, 50));
  };

  // ─── FETCH ──────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async (params = {}) => {
    if (!user) return;
    setLoading(true);
    try {
      const r = await tasksAPI.getAll(params);
      setTasks(r.data.tasks);
    } catch (e) { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [user]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    try { const r = await goalsAPI.getAll(); setGoals(r.data.goals); }
    catch (e) { /* silent */ }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    try { const r = await statsAPI.dashboard(); setStats(r.data.stats); }
    catch (e) { /* silent */ }
  }, [user]);

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    try { const r = await remindersAPI.getAll(); setReminders(r.data.reminders); }
    catch (e) { /* silent */ }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchGoals();
      fetchStats();
      fetchReminders();
    } else {
      setTasks([]); setGoals([]); setStats(null); setReminders([]);
    }
  }, [user]);

  // ─── TASK ACTIONS ────────────────────────────────────────────────────────
  const createTask = async (data) => {
    const r = await tasksAPI.create(data);
    setTasks(prev => [r.data.task, ...prev]);
    addActivity('add', `Added "${data.title}"`);
    fetchStats();
    toast.success('✨ Task created!');
    return r.data.task;
  };

  const updateTask = async (id, data) => {
    const r = await tasksAPI.update(id, data);
    setTasks(prev => prev.map(t => t._id === id ? r.data.task : t));
    addActivity('edit', `Updated "${data.title || r.data.task.title}"`);
    fetchStats();
    toast.success('✏️ Task updated!');
    return r.data.task;
  };

  const toggleComplete = async (id) => {
    const r = await tasksAPI.toggleComplete(id);
    setTasks(prev => prev.map(t => t._id === id ? r.data.task : t));
    const t = r.data.task;
    if (t.completed) {
      addActivity('complete', `Completed "${t.title}"`);
      toast.success('🎉 Task completed!');
      confetti();
    } else {
      addActivity('edit', `Reopened "${t.title}"`);
      toast('↩️ Task reopened');
    }
    fetchStats();
    return r.data.task;
  };

  const toggleSubtask = async (taskId, subId) => {
    const r = await tasksAPI.toggleSubtask(taskId, subId);
    setTasks(prev => prev.map(t => t._id === taskId ? r.data.task : t));
    return r.data.task;
  };

  const deleteTask = async (id) => {
    const t = tasks.find(x => x._id === id);
    await tasksAPI.delete(id);
    setTasks(prev => prev.filter(x => x._id !== id));
    addActivity('delete', `Deleted "${t?.title}"`);
    fetchStats();
    toast.error('🗑️ Task deleted');
  };

  const togglePin = async (id) => {
    const t = tasks.find(x => x._id === id);
    if (!t) return;
    const r = await tasksAPI.update(id, { pinned: !t.pinned });
    setTasks(prev => prev.map(x => x._id === id ? r.data.task : x));
    toast(r.data.task.pinned ? '📌 Pinned' : '📌 Unpinned');
  };

  const duplicateTask = async (id) => {
    const t = tasks.find(x => x._id === id);
    if (!t) return;
    const { _id, __v, createdAt, updatedAt, ...rest } = t;
    await createTask({ ...rest, title: t.title + ' (copy)', completed: false });
  };

  const moveTaskStatus = async (id, status) => {
    const r = await tasksAPI.update(id, { status, completed: status === 'done' });
    setTasks(prev => prev.map(t => t._id === id ? r.data.task : t));
    fetchStats();
  };

  // ─── GOAL ACTIONS ────────────────────────────────────────────────────────
  const createGoal = async (data) => {
    const r = await goalsAPI.create(data);
    setGoals(prev => [r.data.goal, ...prev]);
    addActivity('goal', `Created goal "${data.title}"`);
    toast.success('🎯 Goal created!');
    return r.data.goal;
  };

  const updateGoal = async (id, data) => {
    const r = await goalsAPI.update(id, data);
    setGoals(prev => prev.map(g => g._id === id ? r.data.goal : g));
    toast.success('🎯 Goal updated!');
    return r.data.goal;
  };

  const deleteGoal = async (id) => {
    await goalsAPI.delete(id);
    setGoals(prev => prev.filter(g => g._id !== id));
    toast.error('Goal deleted');
  };

  return (
    <TaskContext.Provider value={{
      tasks, goals, stats, reminders, loading, activity,
      fetchTasks, fetchGoals, fetchStats, fetchReminders,
      createTask, updateTask, toggleComplete, toggleSubtask,
      deleteTask, togglePin, duplicateTask, moveTaskStatus,
      createGoal, updateGoal, deleteGoal,
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => useContext(TaskContext);

function confetti() {
  const colors = ['#6c63ff','#ff5ca8','#00e5c0','#ffb830','#ff6b6b'];
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;width:10px;height:10px;border-radius:${Math.random()>.5?'50%':'2px'};background:${colors[i%colors.length]};left:${Math.random()*100}vw;top:-20px;z-index:9999;animation:confettiDrop ${1.5+Math.random()}s ease-in ${Math.random()*.5}s forwards;pointer-events:none`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }
}
