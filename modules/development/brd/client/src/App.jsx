import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import MeetingListPage from './pages/MeetingListPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import MeetingFormPage from './pages/MeetingFormPage';
import ContractorListPage from './pages/ContractorListPage';
import ContractorFormPage from './pages/ContractorFormPage';

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
        <Route index element={<Navigate to="/meetings" replace />} />
        <Route path="meetings" element={<MeetingListPage />} />
        <Route path="meetings/new" element={<MeetingFormPage />} />
        <Route path="meetings/:id" element={<MeetingDetailPage />} />
        <Route path="meetings/:id/edit" element={<MeetingFormPage />} />
        <Route path="contractors" element={<ContractorListPage />} />
        <Route path="contractors/new" element={<ContractorFormPage />} />
        <Route path="contractors/:id/edit" element={<ContractorFormPage />} />
      </Route>
    </Routes>
  );
}
