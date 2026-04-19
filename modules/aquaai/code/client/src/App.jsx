import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import UsagePage from './pages/UsagePage';
import ModelsPage from './pages/ModelsPage';
import BudgetPage from './pages/admin/BudgetPage';

// NOTE: AD group constants (SAWS-AquaAI-Admin, SAWS-AquaAI-User) are
// defined in the server authorize.js for post-PoC use. During PoC, all
// authenticated AD users can access all routes.

export default function App() {
  return (
    <Routes>
      {/* Root always lands on usage for authenticated users */}
      <Route index element={<Navigate to="/usage" replace />} />

      {/* All routes sit inside authenticated Layout — SWA edge enforces AD login */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/usage" element={<UsagePage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/admin/budget" element={<BudgetPage />} />
      </Route>
    </Routes>
  );
}
