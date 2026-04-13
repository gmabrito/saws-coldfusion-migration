import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import MapListPage from './pages/MapListPage';
import MapDetailPage from './pages/MapDetailPage';
import MapFormPage from './pages/MapFormPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<ProtectedRoute><MapListPage /></ProtectedRoute>} />
        <Route path="/maps" element={<ProtectedRoute><MapListPage /></ProtectedRoute>} />
        <Route path="/maps/new" element={<AdminRoute><MapFormPage /></AdminRoute>} />
        <Route path="/maps/:id" element={<ProtectedRoute><MapDetailPage /></ProtectedRoute>} />
        <Route path="/maps/:id/edit" element={<AdminRoute><MapFormPage /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
