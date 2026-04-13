import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SolicitationListPage from './pages/SolicitationListPage';
import SolicitationDetailPage from './pages/SolicitationDetailPage';
import SolicitationFormPage from './pages/SolicitationFormPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/solicitations" replace />} />
        <Route path="solicitations" element={<SolicitationListPage />} />
        <Route path="solicitations/new" element={<SolicitationFormPage />} />
        <Route path="solicitations/:id" element={<SolicitationDetailPage />} />
        <Route path="solicitations/:id/edit" element={<SolicitationFormPage />} />
      </Route>
    </Routes>
  );
}
