import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import OverviewPage from './pages/OverviewPage';
import EventsPage from './pages/EventsPage';
import ModulesPage from './pages/ModulesPage';
import ReportsPage from './pages/admin/ReportsPage';

// NOTE: AD group constants (SAWS-AquaAnalytics-Admin, SAWS-AquaAnalytics-Viewer)
// are defined in the server authorize.js for post-PoC use. During PoC, all
// authenticated AD users can access all routes.

export default function App() {
  return (
    <Routes>
      {/* Root always lands on overview for authenticated users */}
      <Route index element={<Navigate to="/overview" replace />} />

      {/* All routes sit inside authenticated Layout — SWA edge enforces AD login */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
