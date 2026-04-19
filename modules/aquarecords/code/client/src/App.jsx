import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Public page components kept for post-PoC SAWS.org integration
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

// PoC: All routes require AD authentication — unauthenticated users are
// redirected to AAD login by staticwebapp.config.json before reaching React.
// Post-PoC: restore PublicLayout + /public/* as anonymous routes for SAWS.org
// citizens to submit and check TPIA requests without a SAWS AD account.

export default function App() {
  return (
    <Routes>
      {/* Root always lands on queue for authenticated users */}
      <Route index element={<Navigate to="/internal/queue" replace />} />

      {/* All routes sit inside authenticated Layout — SWA edge enforces AD login */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Internal staff routes */}
        <Route path="/internal/dashboard" element={<DashboardPage />} />
        <Route path="/internal/queue" element={<RequestQueuePage />} />
        <Route path="/internal/requests/:id" element={<RequestDetailPage />} />

        {/* Admin routes */}
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/exemptions" element={<ExemptionsPage />} />

        {/* Post-PoC public pages — AD-gated during PoC, opens to SAWS.org citizens after */}
        <Route path="/public" element={<LandingPage />} />
        <Route path="/public/request" element={<RequestFormPage />} />
        <Route path="/public/status" element={<RequestStatusPage />} />
      </Route>
    </Routes>
  );
}
