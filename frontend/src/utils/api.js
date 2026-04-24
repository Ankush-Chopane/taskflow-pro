import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
};

// ─── TASKS ─────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll:    (params) => api.get('/tasks', { params }),
  getToday:  ()       => api.get('/tasks/today'),
  getOverdue:()       => api.get('/tasks/overdue'),
  getById:   (id)     => api.get(`/tasks/${id}`),
  create:    (data)   => api.post('/tasks', data),
  update:    (id, data) => api.put(`/tasks/${id}`, data),
  toggleComplete: (id) => api.patch(`/tasks/${id}/complete`),
  toggleSubtask:  (taskId, subId) => api.patch(`/tasks/${taskId}/subtask/${subId}`),
  delete:    (id)     => api.delete(`/tasks/${id}`),
  deleteCompleted: () => api.delete('/tasks/batch/completed'),
};

// ─── GOALS ─────────────────────────────────────────────────────────────────
export const goalsAPI = {
  getAll:  ()         => api.get('/goals'),
  create:  (data)     => api.post('/goals', data),
  update:  (id, data) => api.put(`/goals/${id}`, data),
  delete:  (id)       => api.delete(`/goals/${id}`),
};

// ─── STATS ─────────────────────────────────────────────────────────────────
export const statsAPI = {
  dashboard: () => api.get('/stats/dashboard'),
};

// ─── REMINDERS ─────────────────────────────────────────────────────────────
export const remindersAPI = {
  getAll: () => api.get('/reminders'),
};

export default api;
