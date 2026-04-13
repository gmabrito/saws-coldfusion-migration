import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import VendorSearchPage from './pages/VendorSearchPage';
import VendorDetailPage from './pages/VendorDetailPage';
import VendorEditPage from './pages/VendorEditPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<VendorSearchPage />} />
        <Route path="/vendors/new" element={<VendorEditPage />} />
        <Route path="/vendors/:id" element={<VendorDetailPage />} />
        <Route path="/vendors/:id/edit" element={<VendorEditPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
