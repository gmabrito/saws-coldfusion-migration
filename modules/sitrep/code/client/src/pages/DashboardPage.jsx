import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const SEVERITY_BADGE = {
  Critical: 'badge badge-error',
  High:     'badge badge-warn',
  Medium:   'badge badge-unknown',
  Low:      'badge badge-ok',
};

const STATUS_BADGE = {
  active:     'badge badge-error',
  monitoring: 'badge badge-warn',
  resolved:   'badge badge-ok',
};

const STUB_SITREPS = [
  {
    id: 1,
    sitrep_number: 'SITREP-2026-001',
    facility: 'North Loop Pump Station',
    type: 'Water Main Break',
    severity: 'Critical',
    status: 'active',
    assigned_to: 'Operations Team Alpha',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    _stub: true,
  },
  {
    id: 2,
    sitrep_number: 'SITREP-2026-002',
    facility: 'Elmendorf Treatment Plant',
    type: 'Power Outage',
    severity: 'High',
    status: 'monitoring',
    assigned_to: 'Facilities & IT',
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    _stub: true,
  },
  {
    id: 3,
    sitrep_number: 'SITREP-2026-003',
    facility: 'Metrocom Pump Station',
    type: 'Equipment Failure',
    severity: 'Medium',
    status: 'resolved',
    assigned_to: 'Maintenance Crew B',
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    _stub: true,
  },
  {
    id: 4,
    sitrep_number: 'SITREP-2026-004',
    facility: 'Main Office',
    type: 'Security Incident',
    severity: 'Low',
    status: 'resolved',
    assigned_to: 'Security',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    _stub: true,
  },
];

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const [sitreps, setSitreps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get('/api/sitreps')
      .then((res) => setSitreps(res.data))
      .catch(() => setSitreps(STUB_SITREPS))
      .finally(() => setLoading(false));
  }, []);

  const active    = sitreps.filter((s) => s.status === 'active').length;
  const monitoring = sitreps.filter((s) => s.status === 'monitoring').length;
  const resolved  = sitreps.filter((s) => s.status === 'resolved').length;
  const critical  = sitreps.filter((s) => s.severity === 'Critical' && s.status !== 'resolved').length;

  if (loading) return <div className="loading">Loading SITREPs...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>EOC Dashboard</h1>
        <Link to="/sitrep/new" className="btn btn-primary">+ New SITREP</Link>
      </div>

      <div className="dashboard-cards">
        <div className="stat-card red">
          <div className="stat-value">{active}</div>
          <div className="stat-label">Active Incidents</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{monitoring}</div>
          <div className="stat-label">Monitoring</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{critical}</div>
          <div className="stat-label">Critical (open)</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">All SITREPs</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>SITREP #</th>
              <th>Facility</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {sitreps.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">No SITREPs found.</td>
              </tr>
            )}
            {sitreps.map((s) => (
              <tr key={s.id} className="clickable-row" onClick={() => window.location.href = `/sitrep/${s.id}`}>
                <td><Link to={`/sitrep/${s.id}`}>{s.sitrep_number}</Link></td>
                <td>{s.facility}</td>
                <td>{s.type}</td>
                <td><span className={SEVERITY_BADGE[s.severity] || 'badge'}>{s.severity}</span></td>
                <td><span className={STATUS_BADGE[s.status] || 'badge'}>{s.status}</span></td>
                <td>{s.assigned_to}</td>
                <td>{fmtDate(s.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
