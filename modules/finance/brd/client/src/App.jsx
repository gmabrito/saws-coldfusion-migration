import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ContractApplicationPage from './pages/ContractApplicationPage';
import ContractListPage from './pages/ContractListPage';
import ContractDetailPage from './pages/ContractDetailPage';
import ReadingFormPage from './pages/ReadingFormPage';
import ReportPage from './pages/ReportPage';
import AdminContractsPage from './pages/AdminContractsPage';

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
      <Route path="/apply" element={<ContractApplicationPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<ProtectedRoute><ContractListPage /></ProtectedRoute>} />
        <Route path="/contracts" element={<ProtectedRoute><ContractListPage /></ProtectedRoute>} />
        <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetailPage /></ProtectedRoute>} />
        <Route path="/readings" element={<ProtectedRoute><ReadingFormPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
        <Route path="/admin/contracts" element={<AdminRoute><AdminContractsPage /></AdminRoute>} />
      </Route>
    </Routes>
  );
}
