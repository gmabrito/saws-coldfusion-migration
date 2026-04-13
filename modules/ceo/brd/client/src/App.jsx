import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import CommitteeAgendaListPage from './pages/CommitteeAgendaListPage';
import BoardAgendaListPage from './pages/BoardAgendaListPage';
import AgendaDetailPage from './pages/AgendaDetailPage';
import AgendaFormPage from './pages/AgendaFormPage';
import SubscribePage from './pages/SubscribePage';
import LoginPage from './pages/LoginPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/subscribe" element={<SubscribePage />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/board-agendas" replace />} />
        <Route path="/committee-agendas" element={<CommitteeAgendaListPage />} />
        <Route path="/board-agendas" element={<BoardAgendaListPage />} />
        <Route path="/agendas/:id" element={<AgendaDetailPage />} />
        <Route path="/agendas/new" element={
          <ProtectedRoute><AgendaFormPage /></ProtectedRoute>
        } />
        <Route path="/agendas/:id/edit" element={
          <ProtectedRoute><AgendaFormPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}
