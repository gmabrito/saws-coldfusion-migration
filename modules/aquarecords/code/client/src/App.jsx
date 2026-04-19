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

const STAFF_GROUPS = ['SAWS-Records-Staff', 'SAWS-Records-Admin'];
const ADMIN_GROUPS = ['SAWS-Records-Admin'];

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
        <Route
          path="/internal/queue"
          element={
            <ProtectedRoute groups={STAFF_GROUPS}>
              <RequestQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/internal/requests/:id"
          element={
            <ProtectedRoute groups={STAFF_GROUPS}>
              <RequestDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute groups={ADMIN_GROUPS}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exemptions"
          element={
            <ProtectedRoute groups={ADMIN_GROUPS}>
              <ExemptionsPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
