import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import OptInFormPage from './pages/OptInFormPage';
import OptInConfirmationPage from './pages/OptInConfirmationPage';
import AdminOptInsPage from './pages/AdminOptInsPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><OptInFormPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/confirmation" element={
        <ProtectedRoute>
          <Layout><OptInConfirmationPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute>
          <Layout><AdminOptInsPage /></Layout>
        </AdminRoute>
      } />
    </Routes>
  );
}
