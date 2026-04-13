import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DirectoryPage from './pages/DirectoryPage';
import ScheduleFormPage from './pages/ScheduleFormPage';
import ScheduleListPage from './pages/ScheduleListPage';

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
      {/* Directory is public - no auth required */}
      <Route path="/" element={<Layout />}>
        <Route index element={<DirectoryPage />} />
        <Route path="directory" element={<DirectoryPage />} />
      </Route>
      {/* Admin routes require auth */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ScheduleListPage />} />
        <Route path="schedule" element={<ScheduleListPage />} />
        <Route path="schedule/new" element={<ScheduleFormPage />} />
        <Route path="schedule/:id/edit" element={<ScheduleFormPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
