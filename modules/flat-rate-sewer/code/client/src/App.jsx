import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AccountListPage from './pages/accounts/AccountListPage';
import AccountDetailPage from './pages/accounts/AccountDetailPage';
import AccountFormPage from './pages/accounts/AccountFormPage';
import MeterListPage from './pages/meters/MeterListPage';
import ReadingFormPage from './pages/meters/ReadingFormPage';
import AssessmentListPage from './pages/assessments/AssessmentListPage';
import AssessmentReviewPage from './pages/assessments/AssessmentReviewPage';
import RateManagementPage from './pages/admin/RateManagementPage';
import AuditLogPage from './pages/admin/AuditLogPage';
import AssessmentReportPage from './pages/reports/AssessmentReportPage';

const ADMIN = ['SAWS-FRS-Admin'];
const USER_PLUS = ['SAWS-FRS-Admin', 'SAWS-FRS-User'];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />

        {/* Accounts */}
        <Route path="accounts" element={
          <ProtectedRoute groups={USER_PLUS}><AccountListPage /></ProtectedRoute>
        } />
        <Route path="accounts/new" element={
          <ProtectedRoute groups={ADMIN}><AccountFormPage /></ProtectedRoute>
        } />
        <Route path="accounts/:accountNum/edit" element={
          <ProtectedRoute groups={ADMIN}><AccountFormPage /></ProtectedRoute>
        } />
        <Route path="accounts/:accountNum" element={
          <ProtectedRoute groups={USER_PLUS}><AccountDetailPage /></ProtectedRoute>
        } />

        {/* Meters */}
        <Route path="meters/:accountNum" element={
          <ProtectedRoute groups={USER_PLUS}><MeterListPage /></ProtectedRoute>
        } />
        <Route path="meters/search" element={
          <ProtectedRoute groups={USER_PLUS}><MeterListPage /></ProtectedRoute>
        } />

        {/* Readings */}
        <Route path="readings" element={
          <ProtectedRoute groups={USER_PLUS}><ReadingFormPage /></ProtectedRoute>
        } />

        {/* Assessments */}
        <Route path="assessments" element={
          <ProtectedRoute groups={ADMIN}><AssessmentListPage /></ProtectedRoute>
        } />
        <Route path="assessments/:id" element={
          <ProtectedRoute groups={ADMIN}><AssessmentReviewPage /></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="admin/rates" element={
          <ProtectedRoute groups={ADMIN}><RateManagementPage /></ProtectedRoute>
        } />
        <Route path="admin/audit" element={
          <ProtectedRoute groups={ADMIN}><AuditLogPage /></ProtectedRoute>
        } />

        {/* Reports */}
        <Route path="reports/assessment/:accountNum" element={
          <ProtectedRoute groups={ADMIN}><AssessmentReportPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}
