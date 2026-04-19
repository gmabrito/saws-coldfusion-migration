import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

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
    created_by: 'J. Martinez',
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
    created_by: 'R. Flores',
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
    created_by: 'A. Nguyen',
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
    created_by: 'T. Brown',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    _stub: true,
  },
];

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const [sitreps, setSitreps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  useEffect(() => {
    axios
      .get('/api/sitreps')
      .then((res) => setSitreps(res.data))
      .catch(() => setSitreps(STUB_SITREPS))
      .finally(() => setLoading(false));
  }, []);

  if (!isAdmin) {
    return (
      <div className="alert alert-danger">
        Access denied. Admin role required.
      </div>
    );
  }

  const filtered = sitreps.filter((s) => {
    if (filterStatus && s.status !== filterStatus) return false;
    if (filterSeverity && s.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Admin — All SITREPs</h1>
      </div>

      <div className="filters-bar">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="monitoring">Monitoring</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        {(filterStatus || filterSeverity) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setFilterStatus(''); setFilterSeverity(''); }}
          >
            Clear Filters
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--saws-text-muted)' }}>
          {filtered.length} of {sitreps.length} records
        </span>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>SITREP #</th>
                <th>Facility</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">No SITREPs match the current filters.</td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.sitrep_number}</td>
                  <td>{s.facility}</td>
                  <td>{s.type}</td>
                  <td><span className={SEVERITY_BADGE[s.severity] || 'badge'}>{s.severity}</span></td>
                  <td><span className={STATUS_BADGE[s.status] || 'badge'}>{s.status}</span></td>
                  <td>{s.created_by}</td>
                  <td>{fmtDate(s.created_at)}</td>
                  <td>
                    <Link to={`/sitrep/${s.id}`} className="btn btn-secondary btn-sm">View</Link>
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
