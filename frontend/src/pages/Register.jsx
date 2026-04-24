import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoMark}>✦</div>
          <span className={styles.logoText}>Task<span>Flow</span> <span className={styles.pro}>Pro</span></span>
        </div>
        <h2 className={styles.title}>Create account</h2>
        <p className={styles.sub}>Start organizing your life today</p>

        <form onSubmit={submit} className={styles.form}>
          <div className={styles.fg}>
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={handle} placeholder="John Doe" required />
          </div>
          <div className={styles.fg}>
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className={styles.fgRow}>
            <div className={styles.fg}>
              <label>Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} placeholder="6+ chars" required minLength={6} />
            </div>
            <div className={styles.fg}>
              <label>Confirm</label>
              <input name="confirm" type="password" value={form.confirm} onChange={handle} placeholder="Repeat" required />
            </div>
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creating...' : 'Create Account →'}
          </button>
        </form>

        <p className={styles.switch}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
