import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TransmittalListPage from './pages/TransmittalListPage';
import TransmittalFormPage from './pages/TransmittalFormPage';
import TransmittalDetailPage from './pages/TransmittalDetailPage';
import SearchPage from './pages/SearchPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
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
        <Route index element={<TransmittalListPage />} />
        <Route path="transmittals" element={<TransmittalListPage />} />
        <Route path="transmittals/new" element={<TransmittalFormPage />} />
        <Route path="transmittals/:id" element={<TransmittalDetailPage />} />
        <Route path="transmittals/:id/edit" element={<TransmittalFormPage />} />
        <Route path="search" element={<SearchPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
