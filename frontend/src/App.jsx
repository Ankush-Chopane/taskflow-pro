import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard   from './pages/Dashboard';
import Tasks       from './pages/Tasks';
import Kanban      from './pages/Kanban';
import Calendar    from './pages/Calendar';
import Reminders   from './pages/Reminders';
import Goals       from './pages/Goals';
import AIAssistant from './pages/AIAssistant';
import Layout      from './components/Layout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--t2)', fontFamily:'Cabinet Grotesk' }}>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/*" element={
          <PrivateRoute>
            <TaskProvider>
              <Layout>
                <Routes>
                  <Route path="/"          element={<Dashboard />} />
                  <Route path="/tasks"     element={<Tasks />} />
                  <Route path="/kanban"    element={<Kanban />} />
                  <Route path="/calendar"  element={<Calendar />} />
                  <Route path="/reminders" element={<Reminders />} />
                  <Route path="/goals"     element={<Goals />} />
                  <Route path="/ai"        element={<AIAssistant />} />
                  <Route path="*"          element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </TaskProvider>
          </PrivateRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}
