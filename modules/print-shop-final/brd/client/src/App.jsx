import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import JobListPage from './pages/JobListPage';
import JobRequestPage from './pages/JobRequestPage';
import JobDetailPage from './pages/JobDetailPage';
import DashboardPage from './pages/DashboardPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobListPage /></ProtectedRoute>} />
        <Route path="/jobs/new" element={<ProtectedRoute><JobRequestPage /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
