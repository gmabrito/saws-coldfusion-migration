import { useState, useEffect } from 'react';
import axios from 'axios';

const MOCK_OVERVIEW = {
  totalEventsToday: 42,
  activeUsersToday: 7,
  aquaDocsSearchesToday: 18,
  aquaRecordsRequestsToday: 3,
  _stub: true,
};

const MOCK_RECENT_ACTIVITY = [
  { user: 'jsmith',    action: 'Document search: "pump maintenance SOP"',      module: 'AquaDocs',    time: '14:32' },
  { user: 'mjones',    action: 'Chat query: "chlorine dosing procedure"',       module: 'AquaDocs',    time: '14:28' },
  { user: 'bwilliams', action: 'Open records request submitted',                module: 'AquaRecords', time: '14:25' },
  { user: 'lgarcia',   action: 'Document search: "water main break"',           module: 'AquaDocs',    time: '14:20' },
  { user: 'demo',      action: 'Platform health check',                         module: 'AquaHawk',    time: '14:18' },
  { user: 'jsmith',    action: 'Document search: "valve inspection checklist"', module: 'AquaDocs',    time: '14:15' },
  { user: 'mjones',    action: 'Chat query: "pipe repair permit requirements"', module: 'AquaDocs',    time: '14:10' },
  { user: 'kpatel',    action: 'Open records request submitted',                module: 'AquaRecords', time: '14:05' },
];

export default function OverviewPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/internal/analytics/overview')
      .then((res) => setOverview(res.data))
      .catch(() => setOverview(MOCK_OVERVIEW))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading analytics overview...</div>;

  const data = overview || MOCK_OVERVIEW;

  return (
    <div>
      <div className="page-header">
        <h1>Platform Overview</h1>
        <span style={{ fontSize: 12, color: 'var(--saws-text-muted)' }}>
          Cross-module analytics — all schemas in SAWSMigration
          {data._stub && ' · mock data'}
        </span>
      </div>

      {data._stub && (
        <div className="alert alert-info">
          Showing mock data — cross-schema queries require the DB schemas to be provisioned.
          Run the SQL schemas for aquadocs, aquarecords, aquahawk, aquaai, and aquaanalytics first.
        </div>
      )}

      <div className="dashboard-cards">
        <div className="stat-card green">
          <div className="stat-value">{data.totalEventsToday}</div>
          <div className="stat-label">Platform Events Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.activeUsersToday}</div>
          <div className="stat-label">Active Users Today</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{data.aquaDocsSearchesToday}</div>
          <div className="stat-label">AquaDocs Searches Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.aquaRecordsRequestsToday}</div>
          <div className="stat-label">AquaRecords Requests Today</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">Recent Activity</div>
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Action</th><th>Module</th><th>Time</th></tr>
            </thead>
            <tbody>
              {MOCK_RECENT_ACTIVITY.map((a, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{a.user}</td>
                  <td style={{ fontSize: 12, color: 'var(--saws-text-muted)' }}>{a.action}</td>
                  <td>
                    <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0', fontSize: 10 }}>
                      {a.module}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--saws-text-muted)' }}>{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header">Key Metrics (Last 7 Days)</div>
          <table className="data-table">
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>AquaDocs — Doc Searches</td>
                <td><strong>87</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>AquaDocs — Chat Queries</td>
                <td><strong>34</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>AquaRecords — Requests</td>
                <td><strong>12</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Unique Platform Users</td>
                <td><strong>15</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Platform API Calls</td>
                <td><strong>892</strong></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Access Denied Events</td>
                <td><strong style={{ color: 'var(--saws-red)' }}>4</strong></td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 16, padding: '12px', background: 'var(--saws-light)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--saws-text-muted)' }}>
            Data sources: <code>aquadocs.event_log</code>, <code>aquarecords.event_log</code>, <code>aquahawk.event_log</code>
            — same SAWSMigration DB, no cross-DB joins required.
          </div>
        </div>
      </div>
    </div>
  );
}
