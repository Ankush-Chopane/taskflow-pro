import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('tf_token');
    const saved  = localStorage.getItem('tf_user');
    if (token && saved) {
      setUser(JSON.parse(saved));
      authAPI.me()
        .then(r => { setUser(r.data.user); localStorage.setItem('tf_user', JSON.stringify(r.data.user)); })
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await authAPI.login({ email, password });
    localStorage.setItem('tf_token', r.data.token);
    localStorage.setItem('tf_user',  JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (name, email, password) => {
    const r = await authAPI.register({ name, email, password });
    localStorage.setItem('tf_token', r.data.token);
    localStorage.setItem('tf_user',  JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setUser(null);
  };

  const updateUser = async (data) => {
    const r = await authAPI.updateProfile(data);
    setUser(r.data.user);
    localStorage.setItem('tf_user', JSON.stringify(r.data.user));
    toast.success('Profile updated!');
    return r.data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
