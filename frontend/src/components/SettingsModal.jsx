import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../utils/api';
import toast from 'react-hot-toast';
import styles from './SettingsModal.module.css';

export default function SettingsModal({ onClose }) {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    role: user?.role || '',
    settings: { ...user?.settings },
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try { await updateUser(form); onClose(); }
    catch (e) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleSetting = (k) =>
    setForm(f => ({ ...f, settings: { ...f.settings, [k]: !f.settings[k] } }));

  const clearCompleted = async () => {
    if (!confirm('Delete all completed tasks?')) return;
    await tasksAPI.deleteCompleted();
    toast.success('Cleared completed tasks');
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.head}>
          <h2>⚙️ Settings</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.tabs}>
          {['profile','notifications','appearance','data'].map(t => (
            <button key={t} className={`${styles.tab} ${tab===t?styles.tabActive:''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {tab === 'profile' && (
            <div className={styles.section}>
              <div className={styles.fg}>
                <label>Display Name</label>
                <input className={styles.fi} value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div className={styles.fg}>
                <label>Role / Team</label>
                <input className={styles.fi} value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} placeholder="e.g. Developer · Personal" />
              </div>
              <div className={styles.fg}>
                <label>Email</label>
                <input className={styles.fi} value={user?.email} disabled style={{opacity:0.5}} />
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className={styles.section}>
              {[
                { key:'notifications', label:'Browser Notifications', desc:'Get notified when tasks are due' },
                { key:'sound',         label:'Sound Alerts',          desc:'Play a sound for reminders' },
                { key:'digest',        label:'Daily Digest',          desc:'Morning summary of your tasks' },
              ].map(item => (
                <div key={item.key} className={styles.settingRow}>
                  <div><div className={styles.settingLabel}>{item.label}</div><div className={styles.settingDesc}>{item.desc}</div></div>
                  <div className={`${styles.toggle} ${form.settings[item.key] ? styles.toggleOn : ''}`}
                    onClick={() => toggleSetting(item.key)} />
                </div>
              ))}
            </div>
          )}

          {tab === 'appearance' && (
            <div className={styles.section}>
              <div className={styles.settingRow}>
                <div><div className={styles.settingLabel}>Theme</div></div>
                <div className={styles.themeRow}>
                  {['dark','darker','purple'].map(t => (
                    <button key={t} className={`${styles.themeBtn} ${form.settings.theme===t?styles.themeBtnActive:''}`}
                      onClick={() => setForm(f=>({...f,settings:{...f.settings,theme:t}}))}>
                      {t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.settingRow}>
                <div><div className={styles.settingLabel}>Compact Mode</div><div className={styles.settingDesc}>Reduce spacing</div></div>
                <div className={`${styles.toggle} ${form.settings.compact ? styles.toggleOn : ''}`}
                  onClick={() => toggleSetting('compact')} />
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className={styles.section}>
              <p className={styles.settingDesc} style={{marginBottom:14}}>Manage your task data</p>
              <div className={styles.dataRow}>
                <button className={styles.dataBtn} onClick={clearCompleted}>🗑️ Clear Completed Tasks</button>
                <button className={styles.dataBtnDanger} onClick={() => { logout(); onClose(); }}>🚪 Sign Out</button>
              </div>
              <p className={styles.settingDesc} style={{marginTop:16}}>
                Logged in as <strong>{user?.email}</strong>
              </p>
            </div>
          )}
        </div>

        <div className={styles.foot}>
          <button className={styles.btnCancel} onClick={onClose}>Cancel</button>
          <button className={styles.btnSave} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
