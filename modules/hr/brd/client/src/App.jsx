import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import JobListingsPage from './pages/JobListingsPage';
import JobDetailPage from './pages/JobDetailPage';
import JobFormPage from './pages/JobFormPage';
import InactiveDirectoryPage from './pages/InactiveDirectoryPage';
import EmailPreviewPage from './pages/EmailPreviewPage';

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
        <Route path="/" element={<ProtectedRoute><JobListingsPage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobListingsPage /></ProtectedRoute>} />
        <Route path="/jobs/new" element={<AdminRoute><JobFormPage /></AdminRoute>} />
        <Route path="/jobs/:id/edit" element={<AdminRoute><JobFormPage /></AdminRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
        <Route path="/inactive-directory" element={<ProtectedRoute><InactiveDirectoryPage /></ProtectedRoute>} />
        <Route path="/email-preview" element={<AdminRoute><EmailPreviewPage /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
