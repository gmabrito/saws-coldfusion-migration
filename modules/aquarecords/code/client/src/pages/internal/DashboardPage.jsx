import { useState, useEffect } from 'react';
import { requestService } from '../../services/requestService';
import StatusBadge from '../../components/StatusBadge';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    requestService.getStats()
      .then(setStats)
      .catch(() => setError('Failed to load dashboard stats.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Open Records Dashboard</h1>
      </div>

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-value">{stats?.open ?? '—'}</div>
          <div className="stat-label">Open Requests</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{stats?.overdue ?? '—'}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{stats?.due_this_week ?? '—'}</div>
          <div className="stat-label">Due This Week</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{stats?.completed_this_month ?? '—'}</div>
          <div className="stat-label">Completed This Month</div>
        </div>
      </div>

      {stats?.recent_activity && stats.recent_activity.length > 0 && (
        <div className="card">
          <div className="card-header">Recent Activity</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Confirmation #</th>
                <th>Requester</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_activity.map((req) => (
                <tr key={req.id}>
                  <td>
                    <a href={`/internal/requests/${req.id}`} style={{ fontFamily: 'monospace' }}>
                      {req.confirmation_no}
                    </a>
                  </td>
                  <td>{req.requester_name}</td>
                  <td><StatusBadge status={req.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--saws-text-muted)' }}>
                    {new Date(req.modified_at || req.submitted_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
