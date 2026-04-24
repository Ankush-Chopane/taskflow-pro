import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import styles from './TaskModal.module.css';

const COLORS = ['#6c63ff','#ff5ca8','#00e5c0','#ffb830','#ff6b6b','#4ecdc4','#a29bfe'];
const TODAY   = () => new Date().toISOString().split('T')[0];

export default function TaskModal({ onClose, task = null }) {
  const { createTask, updateTask, goals } = useTask();
  const isEdit = !!task;

  const [tab,  setTab]  = useState('basic');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', desc: '', priority: 'medium', category: 'Work',
    status: 'todo', date: TODAY(), time: '', reminder: 15,
    estimate: 0, progress: 0, notes: '', recurring: 'none',
    goalId: '', color: '#6c63ff', tags: [], subtasks: [],
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        desc:  task.desc  || '',
        priority: task.priority || 'medium',
        category: task.category || 'Work',
        status:   task.status   || 'todo',
        date:     task.date     || TODAY(),
        time:     task.time     || '',
        reminder: task.reminder ?? 15,
        estimate: task.estimate || 0,
        progress: task.progress || 0,
        notes:    task.notes    || '',
        recurring: task.recurring || 'none',
        goalId:   task.goalId   || '',
        color:    task.color    || '#6c63ff',
        tags:     task.tags     || [],
        subtasks: (task.subtasks || []).map(s => ({ ...s })),
      });
    }
  }, [task]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Tags
  const [tagInput, setTagInput] = useState('');
  const addTag = (e) => {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const val = tagInput.trim().replace(/,/g,'');
    if (val && !form.tags.includes(val)) set('tags', [...form.tags, val]);
    setTagInput('');
  };
  const removeTag = (t) => set('tags', form.tags.filter(x => x !== t));

  // Subtasks
  const [subInput, setSubInput] = useState('');
  const addSub = () => {
    if (!subInput.trim()) return;
    set('subtasks', [...form.subtasks, { text: subInput.trim(), done: false }]);
    setSubInput('');
  };
  const removeSub  = (i) => set('subtasks', form.subtasks.filter((_, j) => j !== i));
  const toggleSub  = (i) => set('subtasks', form.subtasks.map((s, j) => j === i ? { ...s, done: !s.done } : s));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (isEdit) await updateTask(task._id, form);
      else        await createTask(form);
      onClose();
    } catch (err) {
      console.error(err);
    } finally { setSaving(false); }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.head}>
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {['basic','details','subtasks','notes'].map(t => (
            <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          <div className={styles.body}>
            {/* ── BASIC ── */}
            {tab === 'basic' && (
              <div className={styles.tabContent}>
                <div className={styles.fg}>
                  <label>Task Title *</label>
                  <input className={styles.fi} value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="What needs to be done?" required autoFocus />
                </div>

                <div className={styles.fg}>
                  <label>Priority</label>
                  <div className={styles.priorityRow}>
                    {['high','medium','low'].map(p => (
                      <button type="button" key={p}
                        className={`${styles.priorityBtn} ${styles['p_'+p]} ${form.priority === p ? styles.priorityActive : ''}`}
                        onClick={() => set('priority', p)}>
                        {p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'} {p.charAt(0).toUpperCase()+p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.fg}>
                    <label>Category</label>
                    <select className={styles.fi} value={form.category} onChange={e => set('category', e.target.value)}>
                      {['Work','Personal','Health','Learning','Finance','Other'].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.fg}>
                    <label>Status</label>
                    <select className={styles.fi} value={form.status} onChange={e => set('status', e.target.value)}>
                      <option value="todo">📝 To Do</option>
                      <option value="inprogress">🔄 In Progress</option>
                      <option value="review">👁️ In Review</option>
                      <option value="done">✅ Done</option>
                    </select>
                  </div>
                </div>

                <div className={styles.row2}>
                  <div className={styles.fg}>
                    <label>Due Date</label>
                    <input className={styles.fi} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                  </div>
                  <div className={styles.fg}>
                    <label>Time</label>
                    <input className={styles.fi} type="time" value={form.time} onChange={e => set('time', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── DETAILS ── */}
            {tab === 'details' && (
              <div className={styles.tabContent}>
                <div className={styles.fg}>
                  <label>Description</label>
                  <textarea className={styles.fi} value={form.desc}
                    onChange={e => set('desc', e.target.value)} placeholder="Add more details..." />
                </div>

                <div className={styles.row2}>
                  <div className={styles.fg}>
                    <label>Reminder</label>
                    <select className={styles.fi} value={form.reminder} onChange={e => set('reminder', +e.target.value)}>
                      <option value={0}>No reminder</option>
                      <option value={5}>5 min before</option>
                      <option value={15}>15 min before</option>
                      <option value={30}>30 min before</option>
                      <option value={60}>1 hour before</option>
                      <option value={1440}>1 day before</option>
                    </select>
                  </div>
                  <div className={styles.fg}>
                    <label>Estimate</label>
                    <select className={styles.fi} value={form.estimate} onChange={e => set('estimate', +e.target.value)}>
                      <option value={0}>No estimate</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={60}>1 hour</option>
                      <option value={120}>2 hours</option>
                      <option value={240}>Half day</option>
                      <option value={480}>Full day</option>
                    </select>
                  </div>
                </div>

                <div className={styles.fg}>
                  <label>Progress — {form.progress}%</label>
                  <input type="range" min={0} max={100} value={form.progress}
                    onChange={e => set('progress', +e.target.value)}
                    className={styles.slider} />
                </div>

                <div className={styles.fg}>
                  <label>Tags (press Enter or comma)</label>
                  <div className={styles.tagsWrap}>
                    {form.tags.map(t => (
                      <span key={t} className={styles.tagChip}>
                        {t}<button type="button" onClick={() => removeTag(t)}>×</button>
                      </span>
                    ))}
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={addTag} placeholder="Add tag..." className={styles.tagInput} />
                  </div>
                </div>

                <div className={styles.fg}>
                  <label>Color Accent</label>
                  <div className={styles.colorRow}>
                    {COLORS.map(c => (
                      <div key={c} className={`${styles.colorDot} ${form.color === c ? styles.colorSelected : ''}`}
                        style={{ background: c }} onClick={() => set('color', c)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SUBTASKS ── */}
            {tab === 'subtasks' && (
              <div className={styles.tabContent}>
                <div className={styles.fg}>
                  <label>Subtasks</label>
                  <div className={styles.subAddRow}>
                    <input className={styles.fi} value={subInput}
                      onChange={e => setSubInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSub())}
                      placeholder="Add a subtask..." />
                    <button type="button" className={styles.addSubBtn} onClick={addSub}>Add</button>
                  </div>
                  <div className={styles.subList}>
                    {form.subtasks.map((s, i) => (
                      <div key={i} className={styles.subItem}>
                        <div className={`${styles.subCheck} ${s.done ? styles.subChecked : ''}`}
                          onClick={() => toggleSub(i)}>{s.done ? '✓' : ''}</div>
                        <span className={s.done ? styles.subCrossed : ''}>{s.text}</span>
                        <button type="button" className={styles.subDel} onClick={() => removeSub(i)}>✕</button>
                      </div>
                    ))}
                    {form.subtasks.length === 0 && (
                      <p className={styles.emptyNote}>No subtasks yet. Add one above.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTES ── */}
            {tab === 'notes' && (
              <div className={styles.tabContent}>
                <div className={styles.fg}>
                  <label>Notes & Links</label>
                  <textarea className={styles.fi} style={{ minHeight: 120 }} value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Add notes, links, references..." />
                </div>
                <div className={styles.row2}>
                  <div className={styles.fg}>
                    <label>Recurring</label>
                    <select className={styles.fi} value={form.recurring} onChange={e => set('recurring', e.target.value)}>
                      <option value="none">No recurrence</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className={styles.fg}>
                    <label>Linked Goal</label>
                    <select className={styles.fi} value={form.goalId} onChange={e => set('goalId', e.target.value)}>
                      <option value="">No goal</option>
                      {goals.map(g => <option key={g._id} value={g._id}>{g.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.foot}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnSave} disabled={saving}>
              {saving ? 'Saving...' : isEdit ? '✓ Update Task' : '✓ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
