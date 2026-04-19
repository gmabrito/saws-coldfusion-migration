import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import LandingPage from './pages/public/LandingPage';
import RequestFormPage from './pages/public/RequestFormPage';
import RequestStatusPage from './pages/public/RequestStatusPage';

// Internal pages
import DashboardPage from './pages/internal/DashboardPage';
import RequestQueuePage from './pages/internal/RequestQueuePage';
import RequestDetailPage from './pages/internal/RequestDetailPage';

// Admin pages
import ReportsPage from './pages/admin/ReportsPage';
import ExemptionsPage from './pages/admin/ExemptionsPage';

// NOTE: AD group constants (SAWS-Records-Staff, SAWS-Records-Admin) are
// defined here for post-PoC use. During PoC, all authenticated AD users
// can access all routes. Re-add groups={...} to ProtectedRoute once
// AD groups are provisioned.

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return isAuthenticated
    ? <Navigate to="/internal/queue" replace />
    : <Navigate to="/public" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route index element={<RootRedirect />} />

      {/* Public routes — no auth required */}
      <Route element={<PublicLayout />}>
        <Route path="/public" element={<LandingPage />} />
        <Route path="/public/request" element={<RequestFormPage />} />
        <Route path="/public/status" element={<RequestStatusPage />} />
      </Route>

      {/* Internal routes — auth required */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/internal/dashboard" element={<DashboardPage />} />
        <Route path="/internal/queue" element={<RequestQueuePage />} />
        <Route path="/internal/requests/:id" element={<RequestDetailPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/exemptions" element={<ExemptionsPage />} />
      </Route>
    </Routes>
  );
}
