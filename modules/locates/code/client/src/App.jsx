import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Layout from './components/Layout';
import PublicFormPage from './pages/PublicFormPage';
import ConfirmationPage from './pages/ConfirmationPage';
import LoginPage from './pages/LoginPage';
import AdminQueuePage from './pages/AdminQueuePage';

/**
 * Route structure:
 *  /                  — Public locate submission form (no auth)
 *  /confirmation      — Post-submit confirmation (no auth)
 *  /admin/login       — Staff login (no auth)
 *  /admin             — Staff queue (requires auth — redirects to /admin/login if not logged in)
 *
 * AuthProvider wraps the whole tree so any component can call useAuth().
 * The provider supports guest mode: { user: null } is valid for public pages.
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          {/* Public routes — no login required */}
          <Route index element={<PublicFormPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Staff route — redirects to login if not authenticated */}
          <Route path="/admin" element={<AdminQueuePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
