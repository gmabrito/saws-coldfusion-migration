import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import JobListPage from './pages/JobListPage';
import JobRequestPage from './pages/JobRequestPage';
import JobDetailPage from './pages/JobDetailPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<ProtectedRoute><JobListPage /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute><JobListPage /></ProtectedRoute>} />
        <Route path="/jobs/new" element={<ProtectedRoute><JobRequestPage /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetailPage /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
