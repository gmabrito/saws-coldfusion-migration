import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import StatsDashboardPage from './pages/StatsDashboardPage';
import DailyReadingsPage from './pages/DailyReadingsPage';
import DataEntryPage from './pages/DataEntryPage';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
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
        <Route index element={<StatsDashboardPage />} />
        <Route path="dashboard" element={<StatsDashboardPage />} />
        <Route path="daily-readings" element={<DailyReadingsPage />} />
        <Route
          path="data-entry"
          element={
            <ProtectedRoute roles={['admin', 'operator']}>
              <DataEntryPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
