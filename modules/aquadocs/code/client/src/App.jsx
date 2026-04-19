import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
// Public page components kept for post-PoC SAWS.org integration
import PublicSearchPage from './pages/public/PublicSearchPage';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import PipelineStatusPage from './pages/admin/PipelineStatusPage';
import DocumentsPage from './pages/admin/DocumentsPage';

// NOTE: AD group constants (SAWS-AquaDocs-Admin) are defined here for
// post-PoC use. During PoC, all authenticated AD users can access all routes.
// Re-add groups={ADMIN} to ProtectedRoute once AD groups are provisioned.

// PoC: All routes require AD authentication — unauthenticated users are
// redirected to AAD login by staticwebapp.config.json before reaching React.
// Post-PoC: restore PublicLayout + /public/search as anonymous route for SAWS.org.

export default function App() {
  return (
    <Routes>
      {/* Root always lands on search for authenticated users */}
      <Route index element={<Navigate to="/search" replace />} />

      {/* All routes sit inside authenticated Layout — SWA edge enforces AD login */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/search" element={<SearchPage />} />
        <Route path="/chat" element={<ChatPage />} />
        {/* Convenience redirect — nav uses /admin/pipeline but short form also works */}
        <Route path="/pipeline" element={<Navigate to="/admin/pipeline" replace />} />
        <Route path="/admin/pipeline" element={<PipelineStatusPage />} />
        <Route path="/admin/documents" element={<DocumentsPage />} />

        {/* Post-PoC public page — AD-gated during PoC, opens to SAWS.org after */}
        <Route path="/public/search" element={<PublicSearchPage />} />
      </Route>
    </Routes>
  );
}
