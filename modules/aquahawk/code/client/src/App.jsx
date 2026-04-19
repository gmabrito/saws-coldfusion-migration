import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import ModulesPage from './pages/ModulesPage';
import CostPage from './pages/CostPage';
import ConfigPage from './pages/admin/ConfigPage';

// NOTE: AD group constants (SAWS-AquaHawk-Admin, SAWS-AquaHawk-Viewer) are
// defined in the server authorize.js for post-PoC use. During PoC, all
// authenticated AD users can access all routes.

export default function App() {
  return (
    <Routes>
      {/* Root always lands on dashboard for authenticated users */}
      <Route index element={<Navigate to="/dashboard" replace />} />

      {/* All routes sit inside authenticated Layout — SWA edge enforces AD login */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/costs" element={<CostPage />} />
        <Route path="/admin/config" element={<ConfigPage />} />
      </Route>
    </Routes>
  );
}
