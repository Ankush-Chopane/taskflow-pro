import React, { useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Dashboard() {
  const { tasks, stats, activity, fetchStats } = useTask();
  const navigate = useNavigate();

  useEffect(() => { fetchStats(); }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today);

  const timeAgo = (ts) => {
    const d = Date.now() - ts;
    if (d < 60000) return 'just now';
    if (d < 3600000) return Math.round(d/60000)+'m ago';
    if (d < 86400000) return Math.round(d/3600000)+'h ago';
    return Math.round(d/86400000)+'d ago';
  };

  const ICONS = { complete:'✅', add:'➕', edit:'✏️', delete:'🗑️', goal:'🎯' };
  const ACT_BG = { complete:'rgba(0,229,192,.12)', add:'rgba(108,99,255,.12)', edit:'rgba(255,184,48,.12)', delete:'rgba(255,82,82,.12)', goal:'rgba(255,92,168,.12)' };

  // Donut calc
  const high   = tasks.filter(t=>t.priority==='high'&&!t.completed).length;
  const medium = tasks.filter(t=>t.priority==='medium'&&!t.completed).length;
  const low    = tasks.filter(t=>t.priority==='low'&&!t.completed).length;
  const pTotal = high+medium+low||1;
  const circ   = 239;
  const hArc   = (high/pTotal)*circ;
  const mArc   = (medium/pTotal)*circ;
  const lArc   = (low/pTotal)*circ;

  const weekly = stats?.weekly || [];
  const maxBar = Math.max(...weekly.map(w=>w.count), 1);
  const rate   = stats?.rate || 0;
  const ringOffset = 94.2 - (94.2 * rate / 100);

  return (
    <div className={styles.page}>
      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {[
          { label:'Total Tasks',      val: stats?.total||0,     sub:'all time',      color:'var(--a1)', icon:'📋', bg:'rgba(108,99,255,.12)' },
          { label:'Completed',        val: stats?.done||0,      sub:'all time',      color:'var(--a2)', icon:'✅', bg:'rgba(255,92,168,.12)' },
          { label:'Today\'s Tasks',   val: stats?.todayTotal||0,sub:'scheduled',     color:'var(--a3)', icon:'☀️', bg:'rgba(0,229,192,.12)' },
          { label:'Overdue',          val: stats?.overdue||0,   sub:'need attention',color:'var(--high)',icon:'⚠️', bg:'rgba(255,82,82,.12)' },
        ].map((k,i) => (
          <div key={i} className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={styles.kpiIcon} style={{background:k.bg}}>{k.icon}</div>
              {i===2 && (
                <svg width="44" height="44" style={{transform:'rotate(-90deg)'}}>
                  <circle cx="22" cy="22" r="16" fill="none" stroke="var(--s3)" strokeWidth="4"/>
                  <circle cx="22" cy="22" r="16" fill="none" stroke="var(--a3)" strokeWidth="4"
                    strokeDasharray="100.5"
                    strokeDashoffset={100.5-(100.5*rate/100)}
                    strokeLinecap="round"
                    style={{transition:'stroke-dashoffset .8s ease'}}/>
                </svg>
              )}
            </div>
            <div className={styles.kpiVal} style={{color:k.color}}>{k.val}{i===2?'':(i===3&&k.val>0?'!':'')}</div>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.grid2}>
        {/* Today's tasks */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>☀️ Today's Tasks</h3>
            <button className={styles.viewAll} onClick={() => navigate('/tasks?filter=today')}>View all →</button>
          </div>
          {todayTasks.length === 0
            ? <div className={styles.empty}><div>🎉</div><p>No tasks today!</p></div>
            : todayTasks.slice(0,5).map(t => (
              <div key={t._id} className={styles.miniTask}
                style={{borderLeftColor: t.priority==='high'?'var(--high)':t.priority==='medium'?'var(--med)':'var(--low)'}}>
                <div className={styles.miniTaskTitle} style={{textDecoration:t.completed?'line-through':'none',color:t.completed?'var(--t3)':'inherit'}}>
                  {t.title}
                </div>
                <div className={styles.miniTaskMeta}>
                  {t.time && <span>{t.time}</span>}
                  <span className={`${styles.catTag} ${styles['cat_'+t.category?.toLowerCase()]}`}>{t.category}</span>
                </div>
              </div>
            ))
          }
        </div>

        {/* Priority donut */}
        <div className={styles.card}>
          <div className={styles.cardHead}><h3>Priority Breakdown</h3></div>
          <div className={styles.donutWrap}>
            <svg width="110" height="110" style={{flexShrink:0}}>
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--s3)" strokeWidth="14"/>
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--high)" strokeWidth="14"
                strokeDasharray={`${hArc} ${circ-hArc}`} strokeDashoffset={0}
                transform="rotate(-90 55 55)" style={{transition:'all .8s ease'}}/>
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--med)" strokeWidth="14"
                strokeDasharray={`${mArc} ${circ-mArc}`} strokeDashoffset={-hArc}
                transform="rotate(-90 55 55)" style={{transition:'all .8s ease'}}/>
              <circle cx="55" cy="55" r="40" fill="none" stroke="var(--low)" strokeWidth="14"
                strokeDasharray={`${lArc} ${circ-lArc}`} strokeDashoffset={-(hArc+mArc)}
                transform="rotate(-90 55 55)" style={{transition:'all .8s ease'}}/>
            </svg>
            <div className={styles.donutLegend}>
              {[['var(--high)','High',high],['var(--med)','Medium',medium],['var(--low)','Low',low]].map(([c,l,v])=>(
                <div key={l} className={styles.legendItem}>
                  <div style={{width:10,height:10,borderRadius:3,background:c,flexShrink:0}}/>
                  <span>{l}: <strong>{v}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        {/* Weekly bar chart */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>📊 Weekly Activity</h3>
            <span className={styles.cardSub}>{weekly.reduce((a,b)=>a+b.count,0)} completed</span>
          </div>
          <div className={styles.barChart}>
            {weekly.map((w,i) => (
              <div key={i} className={styles.barCol}>
                <span className={styles.barVal}>{w.count||''}</span>
                <div className={styles.barFill}
                  style={{
                    height: Math.max(w.count/maxBar*90,4)+'px',
                    background: w.day===DAYS[new Date().getDay()]?'linear-gradient(180deg,var(--a1),var(--a2))':'var(--s4)',
                  }} />
                <span className={styles.barLabel} style={{color: w.day===DAYS[new Date().getDay()]?'var(--a1)':'var(--t3)'}}>
                  {w.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className={styles.card}>
          <div className={styles.cardHead}><h3>⚡ Recent Activity</h3></div>
          {activity.length === 0
            ? <div className={styles.empty}><div>📭</div><p>No activity yet</p></div>
            : activity.slice(0,6).map((a,i) => (
              <div key={i} className={styles.actItem}>
                <div className={styles.actDot} style={{background:ACT_BG[a.type]||ACT_BG.add}}>{ICONS[a.type]||'📝'}</div>
                <div>
                  <div className={styles.actText}>{a.text}</div>
                  <div className={styles.actTime}>{timeAgo(a.time)}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
