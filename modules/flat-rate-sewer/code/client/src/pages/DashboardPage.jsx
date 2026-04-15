import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/api';
import { useAuth } from '../components/AuthProvider';
import RoleGate from '../components/RoleGate';

export default function DashboardPage() {
  const { user, isAdmin, isUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await reportService.getDashboard();
      const data = res.data;
      setStats(data.stats || { totalAccounts: 0, activeMeters: 0, assessmentsDue: 0, recentReadings: 0 });
      setActivity(data.recentActivity || []);
      setDueSoon(data.assessmentsDue || []);
    } catch {
      // Use placeholder data when API is unavailable
      setStats({ totalAccounts: 142, activeMeters: 387, assessmentsDue: 12, recentReadings: 56 });
      setActivity([
        { timestamp: new Date().toISOString(), type: 'READING', text: 'Reading submitted for account 100234', user: 'user@saws.org' },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'ASSESSMENT', text: 'Assessment completed for account 100198', user: 'admin@saws.org' },
        { timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'ACCOUNT', text: 'New account 100301 created', user: 'admin@saws.org' },
        { timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'RATE', text: 'Rate schedule updated effective 2026-04-01', user: 'admin@saws.org' },
      ]);
      setDueSoon([
        { account_num: '100234', business_name: 'Downtown Car Wash', next_assessment_date: '2026-04-10' },
        { account_num: '100198', business_name: 'River City Laundry', next_assessment_date: '2026-04-12' },
        { account_num: '100301', business_name: 'SA Brewing Co', next_assessment_date: '2026-04-15' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <span style={{ color: 'var(--saws-text-muted)', fontSize: 13 }}>
          Welcome, {user?.name}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.totalAccounts}</div>
          <div className="stat-label">Total Accounts</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{stats.activeMeters}</div>
          <div className="stat-label">Active Meters</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{stats.assessmentsDue}</div>
          <div className="stat-label">Assessments Due</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.recentReadings}</div>
          <div className="stat-label">Recent Readings (30d)</div>
        </div>
      </div>

      <div className="two-col">
        {/* Accounts Needing Assessment */}
        <div className="card">
          <div className="card-header">Accounts Needing Assessment</div>
          {dueSoon.length === 0 ? (
            <div className="empty-state">No assessments due</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Account #</th>
                  <th>Business</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {dueSoon.map((a) => (
                  <tr key={a.account_num} className="clickable-row">
                    <td>
                      <Link to={`/accounts/${a.account_num}`}>{a.account_num}</Link>
                    </td>
                    <td>{a.business_name}</td>
                    <td>{a.next_assessment_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">Recent Activity</div>
          {activity.length === 0 ? (
            <div className="empty-state">No recent activity</div>
          ) : (
            <ul className="activity-feed">
              {activity.map((evt, i) => (
                <li key={i} className="activity-item">
                  <span className="activity-time">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                  <span className="activity-text">{evt.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">Quick Links</div>
        <div className="quick-links">
          {(isAdmin || isUser) && (
            <>
              <Link to="/accounts" className="quick-link">View All Accounts</Link>
              <Link to="/readings" className="quick-link">Submit Reading</Link>
            </>
          )}
          <RoleGate groups={['SAWS-FRS-Admin']}>
            <Link to="/assessments" className="quick-link">Review Assessments</Link>
            <Link to="/admin/rates" className="quick-link">Manage Rates</Link>
            <Link to="/accounts/new" className="quick-link">New Account</Link>
            <Link to="/admin/audit" className="quick-link">Audit Log</Link>
          </RoleGate>
        </div>
      </div>
    </div>
  );
}
