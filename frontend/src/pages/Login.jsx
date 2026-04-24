import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ 
    email: localStorage.getItem('tf_remember_email') || '', 
    password: '' 
  });
  const [remember, setRemember] = useState(!!localStorage.getItem('tf_remember_email'));
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      if (remember) {
        localStorage.setItem('tf_remember_email', form.email);
      } else {
        localStorage.removeItem('tf_remember_email');
      }
      toast.success('Welcome back! 👋');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleDemo = async () => {
    const demoCreds = { email: 'demo@taskflow.com', password: 'demo123' };
    setForm(demoCreds);
    setLoading(true);
    try {
      await login(demoCreds.email, demoCreds.password);
      toast.success('Logged in with Demo Account');
      navigate('/');
    } catch (err) {
      toast.error('Demo login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>✦</div>
          <span className={styles.logoText}>Task<span>Flow</span> <span className={styles.pro}>Pro</span></span>
        </div>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.sub}>Sign in to your workspace</p>

        <form onSubmit={submit} className={styles.form}>
          <div className={styles.fg}>
            <label>Email</label>
            <input name="email" type="email" value={form.email}
              onChange={handle} placeholder="you@example.com" 
              autoComplete="email" required />
          </div>
          <div className={styles.fg}>
            <label>Password</label>
            <input name="password" type="password" value={form.password}
              onChange={handle} placeholder="••••••••" 
              autoComplete="current-password" required />
          </div>

          <div className={styles.extra}>
            <label className={styles.remember}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p className={styles.switch}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>

        <div className={styles.demo}>
          <p>Instant Access</p>
          <button onClick={handleDemo} disabled={loading}>
            Use Demo Account
          </button>
        </div>
      </div>
    </div>
  );
}
