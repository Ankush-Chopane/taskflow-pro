import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { tasksAPI } from '../utils/api';
import TaskModal from '../components/TaskModal';
import toast from 'react-hot-toast';

// ══════════════════════════════════════════════════════
// KANBAN
// ══════════════════════════════════════════════════════
const COLS = [
  { id:'todo',       label:'📝 To Do',      color:'#6c63ff', bg:'rgba(108,99,255,.15)' },
  { id:'inprogress', label:'🔄 In Progress', color:'#ffb830', bg:'rgba(255,184,48,.15)' },
  { id:'review',     label:'👁️ In Review',   color:'#4ecdc4', bg:'rgba(78,205,196,.15)' },
  { id:'done',       label:'✅ Done',        color:'#00e5c0', bg:'rgba(0,229,192,.15)' },
];
const CAT_BG    = { Work:'rgba(108,99,255,.15)', Personal:'rgba(255,92,168,.15)', Health:'rgba(0,229,192,.15)', Learning:'rgba(255,184,48,.15)', Finance:'rgba(255,107,107,.15)', Other:'rgba(150,150,180,.15)' };
const CAT_COLOR = { Work:'var(--a1)', Personal:'var(--a2)', Health:'var(--a3)', Learning:'var(--a4)', Finance:'#ff7070', Other:'var(--t2)' };

export function Kanban() {
  const { tasks, fetchTasks, moveTaskStatus } = useTask();
  const [dragging,   setDragging]   = useState(null);
  const [editTask,   setEditTask]   = useState(null);
  const [showModal,  setShowModal]  = useState(false);
  const [initStatus, setInitStatus] = useState('todo');

  const dragStart = (e, task) => { setDragging(task); e.dataTransfer.effectAllowed = 'move'; };
  const dragOver  = (e) => { e.preventDefault(); e.currentTarget.style.background = 'rgba(108,99,255,0.06)'; };
  const dragLeave = (e) => { e.currentTarget.style.background = ''; };
  const drop = async (e, colId) => {
    e.preventDefault();
    e.currentTarget.style.background = '';
    if (dragging && dragging.status !== colId) await moveTaskStatus(dragging._id, colId);
    setDragging(null);
  };
  const closeModal = () => { setShowModal(false); setEditTask(null); fetchTasks(); };

  return (
    <div style={{ animation:'fadeUp .3s ease' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, alignItems:'start' }}>
        {COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id || (col.id==='done'&&t.completed&&t.status!=='todo'&&t.status!=='inprogress'&&t.status!=='review'));
          return (
            <div key={col.id} style={{ background:'var(--s1)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden' }}
              onDragOver={dragOver} onDragLeave={dragLeave} onDrop={e=>drop(e,col.id)}>
              <div style={{ padding:'13px 15px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:col.color, flexShrink:0 }} />
                <span style={{ fontSize:'.85rem', fontWeight:700 }}>{col.label}</span>
                <span style={{ marginLeft:'auto', fontSize:'.7rem', fontWeight:700, padding:'2px 8px', borderRadius:8, background:col.bg, color:col.color }}>{colTasks.length}</span>
              </div>
              <div style={{ padding:12, display:'flex', flexDirection:'column', gap:8, minHeight:200 }}>
                {colTasks.map(t => (
                  <div key={t._id} draggable onDragStart={e=>dragStart(e,t)}
                    onClick={() => { setEditTask(t); setShowModal(true); }}
                    style={{ background:'var(--s2)', border:'1px solid var(--border)', borderTop:`2px solid ${t.priority==='high'?'var(--high)':t.priority==='medium'?'var(--med)':'var(--low)'}`, borderRadius:'var(--r2)', padding:12, cursor:'grab', transition:'all .2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.transform='translateY(-1px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none';}}>
                    <div style={{ fontSize:'.85rem', fontWeight:600, marginBottom:8, lineHeight:1.3 }}>{t.title}</div>
                    {t.desc && <div style={{ fontSize:'.75rem', color:'var(--t2)', marginBottom:8, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{t.desc}</div>}
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                      <span style={{ fontSize:'.64rem', fontWeight:700, padding:'2px 7px', borderRadius:5, background:CAT_BG[t.category]||CAT_BG.Other, color:CAT_COLOR[t.category]||'var(--t2)' }}>{t.category}</span>
                      {t.date && <span style={{ fontSize:'.68rem', color:'var(--t2)', marginLeft:'auto' }}>📅 {t.date}</span>}
                    </div>
                    {t.progress > 0 && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ height:3, background:'var(--s4)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', background:'linear-gradient(90deg,var(--a1),var(--a2))', width:t.progress+'%', borderRadius:2 }} />
                        </div>
                        <div style={{ fontSize:'.62rem', color:'var(--t3)', textAlign:'right', marginTop:2 }}>{t.progress}%</div>
                      </div>
                    )}
                    {(t.subtasks||[]).length > 0 && (
                      <div style={{ fontSize:'.7rem', color:'var(--t2)', marginTop:6 }}>
                        📋 {(t.subtasks||[]).filter(s=>s.done).length}/{(t.subtasks||[]).length} subtasks
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={() => { setInitStatus(col.id); setEditTask(null); setShowModal(true); }}
                  style={{ width:'100%', padding:9, background:'none', border:'1px dashed var(--border)', borderRadius:'var(--r2)', color:'var(--t3)', cursor:'pointer', fontFamily:'inherit', fontSize:'.78rem', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--a1)';e.currentTarget.style.color='var(--a1)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--t3)';}}>
                  + Add Card
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {showModal && <TaskModal task={editTask || { status: initStatus }} onClose={closeModal} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// CALENDAR
// ══════════════════════════════════════════════════════
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS7  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function Calendar() {
  const { tasks, fetchTasks } = useTask();
  const [calDate,   setCalDate]   = useState(new Date());
  const [selDate,   setSelDate]   = useState(null);
  const [editTask,  setEditTask]  = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dragging,  setDragging]  = useState(null);

  const y = calDate.getFullYear(), m = calDate.getMonth();
  const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
  const today = new Date();
  const total = Math.ceil((first+days)/7)*7;

  const cells = Array.from({length:total},(_,i)=>{
    let date;
    if(i<first){ date=new Date(y,m,i-first+1); }
    else if(i>=first+days){ date=new Date(y,m,i-first+1); }
    else{ date=new Date(y,m,i-first+1); }
    const ds=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const other=date.getMonth()!==m;
    const isToday=date.toDateString()===today.toDateString();
    return {day:date.getDate(),ds,other,isToday};
  });

  const dropOnCell = async (e,ds) => {
    e.preventDefault();
    if(dragging){ try{ await tasksAPI.update(dragging._id,{date:ds}); await fetchTasks(); toast.success('📅 Moved to '+ds); }catch(e){toast.error('Failed');} }
    setDragging(null);
  };

  const closeModal = () => { setShowModal(false); setEditTask(null); fetchTasks(); };

  return (
    <div style={{animation:'fadeUp .3s ease'}}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
        <button onClick={()=>{const d=new Date(calDate);d.setMonth(d.getMonth()-1);setCalDate(d);}} style={{background:'var(--s2)',border:'1px solid var(--border)',borderRadius:'var(--r2)',color:'var(--t2)',padding:'6px 14px',cursor:'pointer',fontFamily:'inherit',fontSize:'.83rem'}}>‹ Prev</button>
        <span style={{fontFamily:"'Clash Display',sans-serif",fontSize:'1.3rem',fontWeight:700}}>{MONTHS[m]} {y}</span>
        <button onClick={()=>{const d=new Date(calDate);d.setMonth(d.getMonth()+1);setCalDate(d);}} style={{background:'var(--s2)',border:'1px solid var(--border)',borderRadius:'var(--r2)',color:'var(--t2)',padding:'6px 14px',cursor:'pointer',fontFamily:'inherit',fontSize:'.83rem'}}>Next ›</button>
        <button onClick={()=>setCalDate(new Date())} style={{background:'none',border:'1px solid var(--border)',borderRadius:'var(--r2)',color:'var(--t2)',padding:'5px 12px',cursor:'pointer',fontFamily:'inherit',fontSize:'.78rem'}}>Today</button>
      </div>
      <div style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'var(--s2)',borderBottom:'1px solid var(--border)'}}>
          {DAYS7.map(d=><div key={d} style={{textAlign:'center',padding:'11px 0',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--t3)'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
          {cells.map(({day,ds,other,isToday},i)=>{
            const dTasks=tasks.filter(t=>t.date===ds);
            return(
              <div key={i} style={{minHeight:110,borderRight:'1px solid var(--border)',borderBottom:'1px solid var(--border)',padding:'8px 9px',cursor:'pointer',transition:'background .15s',background:isToday?'rgba(108,99,255,.05)':'transparent',opacity:other?0.3:1}}
                onDragOver={e=>e.preventDefault()} onDrop={e=>dropOnCell(e,ds)}
                onClick={()=>{setSelDate(ds);setEditTask(null);setShowModal(true);}}>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:'.83rem',fontWeight:600,marginBottom:5,width:26,height:26,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',background:isToday?'var(--a1)':'transparent',color:isToday?'white':'inherit'}}>{day}</div>
                {dTasks.slice(0,3).map(t=>(
                  <div key={t._id} draggable onDragStart={e=>{e.stopPropagation();setDragging(t);}}
                    onClick={e=>{e.stopPropagation();setEditTask(t);setShowModal(true);}}
                    style={{fontSize:'.67rem',padding:'2px 6px',borderRadius:4,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer',background:t.priority==='high'?'rgba(255,82,82,.2)':t.priority==='medium'?'rgba(255,184,48,.2)':'rgba(0,229,192,.2)',color:t.priority==='high'?'var(--high)':t.priority==='medium'?'var(--med)':'var(--low)'}}>
                    {t.title}
                  </div>
                ))}
                {dTasks.length>3&&<div style={{fontSize:'.62rem',color:'var(--t3)',marginTop:2}}>+{dTasks.length-3} more</div>}
              </div>
            );
          })}
        </div>
      </div>
      {showModal && <TaskModal task={editTask||(selDate?{date:selDate}:null)} onClose={closeModal} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// REMINDERS
// ══════════════════════════════════════════════════════
export function Reminders() {
  const { reminders, fetchReminders } = useTask();
  useEffect(()=>{fetchReminders();},[]);
  const now=new Date();
  const ICONS={Work:'💼',Personal:'🏠',Health:'💪',Learning:'📚',Finance:'💰',Other:'📌'};
  const fmtTime=(t)=>{if(!t)return'';const[h,min]=t.split(':');const hr=parseInt(h);return`${hr%12||12}:${min} ${hr>=12?'PM':'AM'}`;};

  if(reminders.length===0) return(
    <div style={{animation:'fadeUp .3s ease',textAlign:'center',padding:60,color:'var(--t3)'}}>
      <div style={{fontSize:'3rem',marginBottom:12}}>🔕</div>
      <p style={{fontSize:'.9rem'}}>No upcoming reminders</p>
      <p style={{fontSize:'.8rem',marginTop:8,color:'var(--t4)'}}>Add a time to your tasks to see reminders here</p>
    </div>
  );

  return(
    <div style={{animation:'fadeUp .3s ease'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {reminders.map(t=>{
          const dt=new Date(t.date+'T'+t.time);
          const diff=Math.round((dt-now)/60000);
          let badge,badgeStyle;
          if(t.completed){badge='Done';badgeStyle={background:'rgba(0,229,192,.15)',color:'var(--a3)'};}
          else if(diff<0){badge='Overdue';badgeStyle={background:'rgba(255,82,82,.15)',color:'var(--high)'};}
          else if(diff<60){badge=`In ${diff}m`;badgeStyle={background:'rgba(255,184,48,.15)',color:'var(--med)'};}
          else{badge=fmtTime(t.time);badgeStyle={background:'rgba(108,99,255,.15)',color:'var(--a1)'};}
          return(
            <div key={t._id} style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:18,display:'flex',alignItems:'center',gap:14,transition:'all .2s',cursor:'pointer'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{width:46,height:46,borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',background:'var(--s2)',flexShrink:0}}>{ICONS[t.category]||'📌'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'.9rem',fontWeight:700,marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.title}</div>
                <div style={{fontSize:'.75rem',color:'var(--t2)',display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span>📅 {t.date}</span><span>🕐 {fmtTime(t.time)}</span>
                  <span style={{fontWeight:600,color:'var(--a1)'}}>{t.category}</span>
                </div>
              </div>
              <span style={{fontSize:'.68rem',fontWeight:700,padding:'3px 10px',borderRadius:20,textTransform:'uppercase',letterSpacing:'.06em',whiteSpace:'nowrap',flexShrink:0,...badgeStyle}}>{badge}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// GOALS
// ══════════════════════════════════════════════════════
export function Goals() {
  const { goals, createGoal, updateGoal, deleteGoal } = useTask();
  const [showModal, setShowModal] = useState(false);
  const [editGoal,  setEditGoal]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({ title:'', desc:'', category:'Work', target:10, current:0, date:'' });

  const openAdd  = () => { setEditGoal(null); setForm({title:'',desc:'',category:'Work',target:10,current:0,date:''}); setShowModal(true); };
  const openEdit = (g) => { setEditGoal(g); setForm({title:g.title,desc:g.desc||'',category:g.category,target:g.target,current:g.current,date:g.date||''}); setShowModal(true); };
  const save = async (e) => {
    e.preventDefault();
    if(!form.title.trim()) return;
    setSaving(true);
    try { if(editGoal) await updateGoal(editGoal._id,form); else await createGoal(form); setShowModal(false); }
    catch(err) { toast.error('Failed to save goal'); }
    setSaving(false);
  };

  const GRAD={Work:'linear-gradient(135deg,var(--a1),#8b7fff)',Health:'linear-gradient(135deg,var(--a3),#00b894)',Learning:'linear-gradient(135deg,var(--a4),#e17055)',Finance:'linear-gradient(135deg,#00b894,var(--a3))',Personal:'linear-gradient(135deg,var(--a2),#fd79a8)'};
  const iStyle={background:'var(--s2)',border:'1px solid var(--border)',borderRadius:'var(--r2)',padding:'10px 13px',color:'var(--text)',fontSize:'.87rem',outline:'none',fontFamily:'inherit',width:'100%'};
  const lStyle={fontSize:'.7rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--t2)'};

  return(
    <div style={{animation:'fadeUp .3s ease'}}>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button onClick={openAdd} style={{padding:'8px 18px',borderRadius:'var(--r2)',background:'linear-gradient(135deg,var(--a1),#8b7fff)',color:'white',border:'none',fontFamily:'inherit',fontSize:'.85rem',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 14px rgba(108,99,255,.3)'}}>+ Add Goal</button>
      </div>
      {goals.length===0
        ?<div style={{textAlign:'center',padding:60,color:'var(--t3)'}}><div style={{fontSize:'3rem',marginBottom:12}}>🎯</div><p>No goals yet. Create your first goal!</p></div>
        :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {goals.map(g=>{
            const pct=Math.round(Math.min(g.current/g.target,1)*100);
            const grad=GRAD[g.category]||GRAD.Personal;
            return(
              <div key={g._id} onClick={()=>openEdit(g)} style={{background:'var(--s1)',border:'1px solid var(--border)',borderRadius:'var(--r)',padding:20,cursor:'pointer',transition:'all .25s',position:'relative'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none';}}>
                <div style={{fontSize:'.65rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--t3)',marginBottom:10}}>{g.category}</div>
                <div style={{fontSize:'1rem',fontWeight:700,marginBottom:6,lineHeight:1.3}}>{g.title}</div>
                <div style={{fontSize:'.78rem',color:'var(--t2)',marginBottom:16,lineHeight:1.5}}>{g.desc}</div>
                <div style={{height:6,background:'var(--s3)',borderRadius:3,overflow:'hidden',marginBottom:7}}>
                  <div style={{height:'100%',borderRadius:3,background:grad,width:pct+'%',transition:'width .6s ease'}} />
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.72rem',color:'var(--t2)',marginBottom:10}}>
                  <span>{g.current}/{g.target} tasks</span><span>{pct}%</span>
                </div>
                <div style={{fontFamily:"'Clash Display',sans-serif",fontSize:'1.5rem',fontWeight:700,background:grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{pct}%</div>
                {g.date&&<div style={{fontSize:'.72rem',color:'var(--t3)',marginTop:4}}>📅 Due: {g.date}</div>}
                <button onClick={e=>{e.stopPropagation();if(window.confirm('Delete this goal?'))deleteGoal(g._id);}}
                  style={{position:'absolute',top:12,right:12,background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:'.85rem',opacity:.4,transition:'opacity .2s',padding:4}}
                  onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.4}>✕</button>
              </div>
            );
          })}
        </div>
      }
      {showModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',backdropFilter:'blur(6px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
          onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div style={{background:'var(--s1)',border:'1px solid var(--border2)',borderRadius:20,width:'100%',maxWidth:460,boxShadow:'0 40px 80px rgba(0,0,0,.6)',animation:'modalIn .3s cubic-bezier(.34,1.56,.64,1)'}}>
            <div style={{padding:'20px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h2 style={{fontFamily:"'Clash Display',sans-serif",fontSize:'1.1rem',fontWeight:700}}>{editGoal?'Edit Goal':'New Goal'}</h2>
              <button onClick={()=>setShowModal(false)} style={{background:'var(--s3)',border:'none',borderRadius:8,width:30,height:30,cursor:'pointer',color:'var(--t2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem'}}>✕</button>
            </div>
            <form onSubmit={save} style={{padding:'0 24px 24px',display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={lStyle}>Title *</label>
                <input type="text" required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="What do you want to achieve?" style={iStyle} />
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <label style={lStyle}>Description</label>
                <input type="text" value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Describe your goal..." style={iStyle} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <label style={lStyle}>Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={iStyle}>
                    {['Work','Health','Learning','Finance','Personal'].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <label style={lStyle}>Target #</label>
                  <input type="number" min={1} value={form.target} onChange={e=>setForm(f=>({...f,target:+e.target.value}))} style={iStyle} />
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <label style={lStyle}>Current Progress</label>
                  <input type="number" min={0} value={form.current} onChange={e=>setForm(f=>({...f,current:+e.target.value}))} style={iStyle} />
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <label style={lStyle}>Target Date</label>
                  <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={iStyle} />
                </div>
              </div>
              <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:6}}>
                <button type="button" onClick={()=>setShowModal(false)} style={{padding:'9px 16px',borderRadius:'var(--r2)',background:'var(--s2)',border:'1px solid var(--border)',color:'var(--t2)',cursor:'pointer',fontFamily:'inherit',fontSize:'.83rem',fontWeight:600}}>Cancel</button>
                <button type="submit" disabled={saving} style={{padding:'9px 20px',borderRadius:'var(--r2)',background:'linear-gradient(135deg,var(--a1),#8b7fff)',color:'white',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'.83rem',fontWeight:700,opacity:saving?0.6:1}}>
                  {saving?'Saving...':'Save Goal 🎯'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
