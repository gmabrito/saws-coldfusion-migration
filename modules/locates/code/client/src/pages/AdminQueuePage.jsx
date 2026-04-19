/**
 * AdminQueuePage — STAFF ONLY
 *
 * Displays incoming locate requests. Redirects to /admin/login if not authenticated.
 * Stat cards: pending, assigned, completed today.
 * Table with status dropdown for inline updates.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

const STATUSES = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'];

const STUB_FALLBACK = [
  {
    id: 1, locate_number: 'LOC-2026-001', status: 'pending',
    first_name: 'Maria', last_name: 'Hernandez', company: 'Hernandez Landscaping LLC',
    address: '445 Huebner Rd', work_type: 'Residential',
    planned_start_date: '2026-04-25', created_at: new Date(Date.now() - 14400000).toISOString(),
    _stub: true,
  },
  {
    id: 2, locate_number: 'LOC-2026-002', status: 'pending',
    first_name: 'James', last_name: 'Okafor', company: 'Okafor Construction Group',
    address: '1234 Broadway', work_type: 'Commercial',
    planned_start_date: '2026-04-26', created_at: new Date(Date.now() - 28800000).toISOString(),
    _stub: true,
  },
  {
    id: 3, locate_number: 'LOC-2026-003', status: 'assigned',
    first_name: 'Tom', last_name: 'Briggs', company: 'City of San Antonio Public Works',
    address: '890 Fredericksburg Rd', work_type: 'Road Work',
    planned_start_date: '2026-04-28', created_at: new Date(Date.now() - 86400000).toISOString(),
    _stub: true,
  },
  {
    id: 4, locate_number: 'LOC-2026-004', status: 'in-progress',
    first_name: 'Sandra', last_name: 'Nguyen', company: 'TxBore Directional Drilling',
    address: '78 SW Loop 410', work_type: 'Other',
    planned_start_date: '2026-04-22', created_at: new Date(Date.now() - 172800000).toISOString(),
    _stub: true,
  },
  {
    id: 5, locate_number: 'LOC-2026-005', status: 'completed',
    first_name: 'David', last_name: 'Pittman', company: 'Pittman Properties',
    address: '2233 NW Military Hwy', work_type: 'Landscaping',
    planned_start_date: '2026-04-19', created_at: new Date(Date.now() - 259200000).toISOString(),
    _stub: true,
  },
];

function statusBadgeClass(status) {
  switch (status) {
    case 'pending':     return 'badge badge-warn';
    case 'assigned':    return 'badge badge-unknown';
    case 'in-progress': return 'badge badge-ok';
    case 'completed':   return 'badge badge-ok';
    case 'cancelled':   return 'badge badge-error';
    default:            return 'badge badge-unknown';
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AdminQueuePage() {
  const { isStaff, getToken } = useAuth();
  const navigate = useNavigate();
  const [locates, setLocates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStub, setIsStub] = useState(false);
  const [updating, setUpdating] = useState(null); // id being updated

  // Guard — redirect to login if not staff
  useEffect(() => {
    if (!isStaff) {
      navigate('/admin/login', { replace: true });
    }
  }, [isStaff, navigate]);

  useEffect(() => {
    if (!isStaff) return;
    loadLocates();
  }, [isStaff]);

  async function loadLocates() {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/locates', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setLocates(Array.isArray(data) ? data : STUB_FALLBACK);
      setIsStub(!!(Array.isArray(data) && data[0]?._stub));
    } catch {
      setLocates(STUB_FALLBACK);
      setIsStub(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, newStatus) {
    setUpdating(id);
    // Optimistic update
    setLocates(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    try {
      await axios.patch(`/api/locates/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch {
      // Silently keep optimistic update in stub mode
    } finally {
      setUpdating(null);
    }
  }

  // Stats
  const pending = locates.filter(l => l.status === 'pending').length;
  const assigned = locates.filter(l => l.status === 'assigned').length;
  const today = new Date().toDateString();
  const completedToday = locates.filter(l => l.status === 'completed' && new Date(l.created_at).toDateString() === today).length;

  if (!isStaff) return null;

  return (
    <div className="app-content">
      {/* Page header */}
      <div className="page-header">
        <h1>Locate Request Queue</h1>
        <button className="btn btn-secondary btn-sm" onClick={loadLocates}>
          Refresh
        </button>
      </div>

      {isStub && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          Showing stub data — API or database not connected.
        </div>
      )}

      {/* Stat cards */}
      <div className="dashboard-cards">
        <div className="stat-card orange">
          <div className="stat-value">{pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{assigned}</div>
          <div className="stat-label">Assigned</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{completedToday}</div>
          <div className="stat-label">Completed Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{locates.length}</div>
          <div className="stat-label">Total Requests</div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">Loading locate requests…</div>
      ) : locates.length === 0 ? (
        <div className="empty-state">No locate requests found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Submitted</th>
                <th>Name / Company</th>
                <th>Address</th>
                <th>Work Type</th>
                <th>Planned Start</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {locates.map(loc => (
                <tr key={loc.id}>
                  <td>
                    <strong style={{ color: 'var(--text-heading)', fontFamily: 'monospace', fontSize: '13px' }}>
                      {loc.locate_number}
                    </strong>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {formatDateTime(loc.created_at)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{loc.first_name} {loc.last_name}</div>
                    {loc.company && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{loc.company}</div>
                    )}
                  </td>
                  <td style={{ fontSize: '13px' }}>{loc.address}</td>
                  <td>{loc.work_type}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(loc.planned_start_date)}</td>
                  <td>
                    <span
                      className={statusBadgeClass(loc.status)}
                      style={loc.status === 'completed' ? { opacity: 0.7 } : {}}
                    >
                      {loc.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={loc.status}
                      onChange={e => handleStatusChange(loc.id, e.target.value)}
                      disabled={updating === loc.id}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
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
