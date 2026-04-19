import { useState, useEffect } from 'react';
import { requestService } from '../../services/requestService';

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    requestService.getReports()
      .then(setReports)
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading reports...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const maxMonthCount = reports?.by_month
    ? Math.max(...reports.by_month.map((m) => m.count), 1)
    : 1;

  return (
    <div>
      <div className="page-header">
        <h1>SLA Performance Reports</h1>
      </div>

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-value">{reports?.avg_response_days?.toFixed(1) ?? '—'}</div>
          <div className="stat-label">Avg Response Days</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">
            {reports?.on_time_pct != null ? `${reports.on_time_pct.toFixed(0)}%` : '—'}
          </div>
          <div className="stat-label">On-Time Response Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports?.total_completed ?? '—'}</div>
          <div className="stat-label">Total Completed</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{reports?.total_denied ?? '—'}</div>
          <div className="stat-label">Total Denied / Partial</div>
        </div>
      </div>

      {reports?.by_month && reports.by_month.length > 0 && (
        <div className="card">
          <div className="card-header">Requests by Month</div>
          <ul className="bar-chart">
            {reports.by_month.map((m) => (
              <li key={m.month} className="bar-row">
                <span className="bar-label">{m.month}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(m.count / maxMonthCount) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{m.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reports?.top_exemptions && reports.top_exemptions.length > 0 && (
        <div className="card">
          <div className="card-header">Top Exemptions Used</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Exemption Code</th>
                <th>Statutory Basis</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {reports.top_exemptions.map((ex) => (
                <tr key={ex.code}>
                  <td style={{ fontFamily: 'monospace' }}>{ex.code}</td>
                  <td>{ex.statutory_basis}</td>
                  <td><strong>{ex.count}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
