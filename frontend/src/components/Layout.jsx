import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import TaskModal from './TaskModal';
import SettingsModal from './SettingsModal';
import styles from './Layout.module.css';

const NAV = [
  { to: '/',          icon: '🏠', label: 'Dashboard' },
  { to: '/tasks',     icon: '📋', label: 'My Tasks' },
  { to: '/kanban',    icon: '🗂️', label: 'Status Board' },
  { to: '/calendar',  icon: '📅', label: 'Calendar' },
  { to: '/reminders', icon: '🔔', label: 'Reminders' },
  { to: '/goals',     icon: '🎯', label: 'Goals' },
  { to: '/ai',        icon: '✦',  label: 'AI Assistant' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { tasks, stats } = useTask();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('tf_theme') || 'dark');

  useEffect(() => { applyTheme(theme); }, [theme]);

  const applyTheme = (t) => {
    const r = document.documentElement;
    if (t === 'light') {
      r.style.setProperty('--bg',      '#f0f2f8');
      r.style.setProperty('--s1',      '#ffffff');
      r.style.setProperty('--s2',      '#f5f6fc');
      r.style.setProperty('--s3',      '#eaecf4');
      r.style.setProperty('--s4',      '#dde0f0');
      r.style.setProperty('--border',  'rgba(0,0,0,0.08)');
      r.style.setProperty('--border2', 'rgba(0,0,0,0.15)');
      r.style.setProperty('--text',    '#1a1a2e');
      r.style.setProperty('--t2',      '#4a4a6a');
      r.style.setProperty('--t3',      '#8888aa');
      r.style.setProperty('--t4',      '#bbbbcc');
    } else {
      r.style.setProperty('--bg',      '#05050a');
      r.style.setProperty('--s1',      '#0d0d15');
      r.style.setProperty('--s2',      '#141420');
      r.style.setProperty('--s3',      '#1c1c2e');
      r.style.setProperty('--s4',      '#242438');
      r.style.setProperty('--border',  'rgba(255,255,255,0.07)');
      r.style.setProperty('--border2', 'rgba(255,255,255,0.12)');
      r.style.setProperty('--text',    '#f0f0fa');
      r.style.setProperty('--t2',      '#9898b8');
      r.style.setProperty('--t3',      '#55556a');
      r.style.setProperty('--t4',      '#333348');
    }
    localStorage.setItem('tf_theme', t);
  };

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');

  const today        = new Date().toISOString().split('T')[0];
  const todayCount   = tasks.filter(t => t.date === today && !t.completed).length;
  const overdueCount = stats?.overdue || 0;
  const titles = { '/':'Dashboard','/tasks':'My Tasks','/kanban':'Status Board','/calendar':'Calendar','/reminders':'Reminders','/goals':'Goals','/ai':'AI Assistant' };
  const pageTitle = titles[location.pathname] || 'TaskFlow';

  return (
    <div className={styles.app}>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>✦</div>
          <span className={styles.logoText}>Task<span>Flow</span></span>
          <span className={styles.logoBadge}>Pro</span>
        </div>

        <div className={styles.userCard}>
          <div className={styles.avatar}>{(user?.name || 'U')[0].toUpperCase()}</div>
          <div>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userRole}>{user?.role || 'Personal · Pro'}</div>
          </div>
          <button className={styles.settingsBtn} onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>Workspace</div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {item.to === '/'          && todayCount   > 0 && <span className={`${styles.badge} ${styles.bPurple}`}>{todayCount}</span>}
              {item.to === '/reminders' && overdueCount > 0 && <span className={`${styles.badge} ${styles.bRed}`}>{overdueCount}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.navLabel} style={{ padding:'0 16px', marginTop:8 }}>Quick Filter</div>
        <div className={styles.quickFilters}>
          {[
            { label:'☀️ Today',      to:'/tasks?filter=today' },
            { label:'⚠️ Overdue',     to:'/tasks?filter=overdue' },
            { label:'📌 Pinned',      to:'/tasks?filter=pinned' },
            { label:'🔜 Upcoming 7d', to:'/tasks?filter=upcoming' },
          ].map(f => (
            <button key={f.label} className={styles.qfItem}
              onClick={() => { navigate(f.to); setSidebarOpen(false); }}>
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.sidebarBottom}>
          <button className={styles.themeToggle} onClick={toggleTheme}>
            <span style={{ fontSize:'1rem' }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span style={{ flex:1, textAlign:'left' }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            <span className={`${styles.themeSwitch} ${theme === 'light' ? styles.themeSwitchOn : ''}`}>
              <span className={styles.themeDot} />
            </span>
          </button>
          <button className={styles.logoutBtn} onClick={logout}>🚪 Sign Out</button>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>☰</button>
          <div>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
            <p className={styles.pageDate}>{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
          </div>
          <div className={styles.topbarRight}>
            <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme" style={{ fontSize:'1.1rem', minWidth:38 }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className={styles.iconBtn} onClick={() => navigate('/reminders')} title="Reminders">
              🔔{overdueCount > 0 && <span className={styles.notifDot} />}
            </button>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowTaskModal(true)}>
              + New Task
            </button>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>

      {showTaskModal && <TaskModal onClose={() => setShowTaskModal(false)} />}
      {showSettings  && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
