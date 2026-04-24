import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTask } from '../context/TaskContext';
import TaskModal from '../components/TaskModal';
import styles from './Tasks.module.css';

const CAT_CLASS = { Work:'catWork', Personal:'catPersonal', Health:'catHealth', Learning:'catLearning', Finance:'catFinance', Other:'catOther' };

const FILTERS = [
  { key:'all',      label:'All' },
  { key:'today',    label:'☀️ Today' },
  { key:'high',     label:'🔴 High' },
  { key:'medium',   label:'🟡 Medium' },
  { key:'low',      label:'🟢 Low' },
  { key:'overdue',  label:'⚠️ Overdue' },
  { key:'done',     label:'✅ Done' },
  { key:'pinned',   label:'📌 Pinned' },
  { key:'upcoming', label:'🔜 Upcoming' },
];

export default function Tasks() {
  const { tasks, toggleComplete, togglePin, deleteTask, duplicateTask } = useTask();
  const [searchParams] = useSearchParams();
  const [filter,  setFilter]  = useState(searchParams.get('filter') || 'all');
  const [sort,    setSort]    = useState('priority');
  const [grouping, setGrouping] = useState(true);
  const [search,  setSearch]  = useState('');
  const [editTask, setEditTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, task }

  useEffect(() => {
    const f = searchParams.get('filter');
    if (f) setFilter(f);
  }, [searchParams]);

  useEffect(() => {
    const hide = () => setCtxMenu(null);
    document.addEventListener('click', hide);
    return () => document.removeEventListener('click', hide);
  }, []);

  const filtered = (() => {
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];
    const next7 = new Date(Date.now()+7*86400000).toISOString().split('T')[0];
    let list = [...tasks];
    if (search) list = list.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.desc||'').toLowerCase().includes(search.toLowerCase()) ||
      (t.tags||[]).some(tg => tg.toLowerCase().includes(search.toLowerCase()))
    );
    switch(filter) {
      case 'today':    list = list.filter(t => t.date === today); break;
      case 'high':     list = list.filter(t => t.priority === 'high'); break;
      case 'medium':   list = list.filter(t => t.priority === 'medium'); break;
      case 'low':      list = list.filter(t => t.priority === 'low'); break;
      case 'overdue':  list = list.filter(t => { const dt=t.date&&t.time?new Date(t.date+'T'+t.time):null; return dt&&dt<now&&!t.completed; }); break;
      case 'done':     list = list.filter(t => t.completed); break;
      case 'pinned':   list = list.filter(t => t.pinned); break;
      case 'upcoming': list = list.filter(t => t.date && t.date >= today && t.date <= next7 && !t.completed); break;
    }
    const PORD = { high:0, medium:1, low:2 };
    list.sort((a,b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === 'priority') return PORD[a.priority]-PORD[b.priority] || (a.date||'').localeCompare(b.date||'');
      if (sort === 'date')     return (a.date||'').localeCompare(b.date||'');
      if (sort === 'title')    return a.title.localeCompare(b.title);
      if (sort === 'created')  return new Date(b.createdAt)-new Date(a.createdAt);
      return 0;
    });
    return list;
  })();

  const groups = grouping
    ? { pinned: filtered.filter(t=>t.pinned), todo: filtered.filter(t=>!t.pinned&&t.status==='todo'), inprogress: filtered.filter(t=>!t.pinned&&t.status==='inprogress'), review: filtered.filter(t=>!t.pinned&&t.status==='review'), done: filtered.filter(t=>!t.pinned&&(t.status==='done'||t.completed)) }
    : { all: filtered };
  const GLABELS = { pinned:'📌 Pinned', todo:'📝 To Do', inprogress:'🔄 In Progress', review:'👁️ In Review', done:'✅ Done', all:'All Tasks' };

  const fmtTime = (t) => { if(!t)return''; const[h,m]=t.split(':'); const hr=+h; return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; };
  const isOverdue = (t) => { const dt=t.date&&t.time?new Date(t.date+'T'+t.time):null; return dt&&dt<new Date()&&!t.completed; };

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterRow}>
          {FILTERS.map(f => (
            <button key={f.key}
              className={`${styles.filterChip} ${filter===f.key?styles.filterActive:''}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <input className={styles.searchBox} value={search}
            onChange={e => setSearch(e.target.value)} placeholder="🔍 Search tasks..." />
          <select className={styles.sortSel} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="priority">Sort: Priority</option>
            <option value="date">Sort: Date</option>
            <option value="title">Sort: Title</option>
            <option value="created">Sort: Created</option>
          </select>
          <button className={styles.groupBtn} onClick={() => setGrouping(g=>!g)}>
            Group: {grouping?'On':'Off'}
          </button>
          <button className={styles.addBtn} onClick={() => { setEditTask(null); setShowModal(true); }}>
            + Add Task
          </button>
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0
        ? <div className={styles.empty}><div className={styles.emptyIcon}>📭</div><p>No tasks found. Try a different filter or add a new task.</p></div>
        : Object.entries(groups).filter(([,ts])=>ts.length>0).map(([gk, ts]) => (
          <div key={gk} className={styles.group}>
            {grouping && (
              <div className={styles.groupHead}>
                <span>{GLABELS[gk]}</span>
                <span className={styles.groupCount}>{ts.length}</span>
                <div className={styles.groupLine} />
              </div>
            )}
            <div className={styles.taskList}>
              {ts.map(t => {
                const over = isOverdue(t);
                const subDone = (t.subtasks||[]).filter(s=>s.done).length;
                const subTotal = (t.subtasks||[]).length;
                return (
                  <div key={t._id}
                    className={`${styles.taskRow} ${t.completed?styles.taskDone:''}`}
                    style={{'--p-color': t.priority==='high'?'var(--high)':t.priority==='medium'?'var(--med)':'var(--low)'}}
                    onClick={() => { setEditTask(t); setShowModal(true); }}
                    onContextMenu={e => { e.preventDefault(); setCtxMenu({ x:e.pageX, y:e.pageY, task:t }); }}>
                    <div className={`${styles.check} ${t.completed?styles.checkDone:''}`}
                      onClick={e => { e.stopPropagation(); toggleComplete(t._id); }}>
                      {t.completed && '✓'}
                    </div>
                    {t.pinned && <span className={styles.pinIcon}>📌</span>}
                    <div className={styles.pDot} style={{background: t.priority==='high'?'var(--high)':t.priority==='medium'?'var(--med)':'var(--low)'}} />
                    <span className={styles.taskTitle}>{t.title}</span>
                    <div className={styles.taskMeta}>
                      <span className={`${styles.catTag} ${styles[CAT_CLASS[t.category]||'catOther']}`}>{t.category}</span>
                      {subTotal > 0 && <span className={styles.metaChip}>{subDone}/{subTotal}</span>}
                      {t.estimate > 0 && <span className={styles.metaChip}>⏱{t.estimate}m</span>}
                      {t.date && (
                        <span className={`${styles.metaDate} ${over?styles.metaOverdue:''}`}>
                          {over?'⚠️ ':t.date===new Date().toISOString().split('T')[0]?'☀️ ':''}{t.date}{t.time?' '+fmtTime(t.time):''}
                        </span>
                      )}
                      {t.recurring && t.recurring !== 'none' && <span className={styles.metaChip}>🔁</span>}
                    </div>
                    <div className={styles.rowActions} onClick={e=>e.stopPropagation()}>
                      <button className={styles.rowBtn} onClick={() => togglePin(t._id)} title="Pin">📌</button>
                      <button className={styles.rowBtn} onClick={() => { setEditTask(t); setShowModal(true); }} title="Edit">✏️</button>
                      <button className={`${styles.rowBtn} ${styles.rowBtnDel}`} onClick={() => deleteTask(t._id)} title="Delete">🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      }

      {/* Context menu */}
      {ctxMenu && (
        <div className={styles.ctxMenu} style={{left:ctxMenu.x, top:ctxMenu.y}} onClick={e=>e.stopPropagation()}>
          <div className={styles.ctxItem} onClick={() => { setEditTask(ctxMenu.task); setShowModal(true); setCtxMenu(null); }}>✏️ Edit</div>
          <div className={styles.ctxItem} onClick={() => { togglePin(ctxMenu.task._id); setCtxMenu(null); }}>{ctxMenu.task.pinned?'📌 Unpin':'📌 Pin'}</div>
          <div className={styles.ctxItem} onClick={() => { toggleComplete(ctxMenu.task._id); setCtxMenu(null); }}>{ctxMenu.task.completed?'↩️ Reopen':'✅ Complete'}</div>
          <div className={styles.ctxItem} onClick={() => { duplicateTask(ctxMenu.task._id); setCtxMenu(null); }}>📋 Duplicate</div>
          <div className={styles.ctxSep}/>
          <div className={`${styles.ctxItem} ${styles.ctxDanger}`} onClick={() => { deleteTask(ctxMenu.task._id); setCtxMenu(null); }}>🗑️ Delete</div>
        </div>
      )}

      {showModal && <TaskModal task={editTask} onClose={() => { setShowModal(false); setEditTask(null); }} />}
    </div>
  );
}
