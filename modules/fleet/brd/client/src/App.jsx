import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import VehicleListPage from './pages/VehicleListPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import VehicleFormPage from './pages/VehicleFormPage';
import MaintenanceFormPage from './pages/MaintenanceFormPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><VehicleListPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicles/new" element={
        <ProtectedRoute>
          <Layout><VehicleFormPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicles/:id" element={
        <ProtectedRoute>
          <Layout><VehicleDetailPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicles/:id/edit" element={
        <ProtectedRoute>
          <Layout><VehicleFormPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicles/:id/maintenance" element={
        <ProtectedRoute>
          <Layout><MaintenanceFormPage /></Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
