import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicSearchPage from './pages/public/PublicSearchPage';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import PipelineStatusPage from './pages/admin/PipelineStatusPage';
import DocumentsPage from './pages/admin/DocumentsPage';

// NOTE: AD group constants (SAWS-AquaDocs-Admin) are defined here for
// post-PoC use. During PoC, all authenticated AD users can access all routes.
// Re-add groups={ADMIN} to ProtectedRoute once AD groups are provisioned.

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  return isAuthenticated
    ? <Navigate to="/search" replace />
    : <Navigate to="/public/search" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route index element={<RootRedirect />} />

      {/* Public routes — no auth required */}
      <Route element={<PublicLayout />}>
        <Route path="/public/search" element={<PublicSearchPage />} />
      </Route>

      {/* Internal routes — authentication required */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/search" element={<SearchPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/admin/pipeline" element={<PipelineStatusPage />} />
        <Route path="/admin/documents" element={<DocumentsPage />} />
      </Route>
    </Routes>
  );
}
