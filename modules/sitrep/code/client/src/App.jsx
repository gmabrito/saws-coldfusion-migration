import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import NewSitrepPage from './pages/NewSitrepPage';
import SitrepDetailPage from './pages/SitrepDetailPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/sitrep/new" element={<NewSitrepPage />} />
        <Route path="/sitrep/:id" element={<SitrepDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
