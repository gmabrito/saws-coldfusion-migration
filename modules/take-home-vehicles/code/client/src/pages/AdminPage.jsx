import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

const today = new Date().toISOString().slice(0, 10);

const STUB = [
  {
    id: 1,
    checkout_number: 'THV-2026-001',
    vehicle_name: '2023 Ford F-150',
    vehicle_plate: 'F-150-01',
    employee_name: 'John Smith',
    purpose: 'after-hours duty',
    checkout_date: today,
    return_date: today,
    status: 'checked-out',
    approved_by: 'Maria Garcia',
    _stub: true,
  },
  {
    id: 2,
    checkout_number: 'THV-2026-002',
    vehicle_name: '2022 RAM 1500',
    vehicle_plate: 'R-001',
    employee_name: 'Maria Garcia',
    purpose: 'on-call',
    checkout_date: today,
    return_date: today,
    status: 'approved',
    approved_by: 'Fleet Manager',
    _stub: true,
  },
  {
    id: 3,
    checkout_number: 'THV-2026-003',
    vehicle_name: '2021 Chevy Silverado',
    vehicle_plate: 'S-003',
    employee_name: 'James Wilson',
    purpose: 'job site',
    checkout_date: today,
    return_date: today,
    status: 'pending',
    approved_by: null,
    _stub: true,
  },
  {
    id: 4,
    checkout_number: 'THV-2026-004',
    vehicle_name: '2023 Ford F-250',
    vehicle_plate: 'F-250-02',
    employee_name: 'Sarah Chen',
    purpose: 'emergency response',
    checkout_date: today,
    return_date: today,
    status: 'returned',
    approved_by: 'Maria Garcia',
    _stub: true,
  },
  {
    id: 5,
    checkout_number: 'THV-2026-005',
    vehicle_name: '2022 Ford Ranger',
    vehicle_plate: 'R-002',
    employee_name: 'Bob Martinez',
    purpose: 'other',
    checkout_date: today,
    return_date: today,
    status: 'denied',
    approved_by: null,
    _stub: true,
  },
];

function statusBadgeClass(status) {
  switch (status) {
    case 'pending':     return 'badge badge-warn';
    case 'approved':    return 'badge badge-ok';
    case 'checked-out': return 'badge badge-ok';
    case 'returned':    return 'badge badge-unknown';
    case 'denied':      return 'badge badge-error';
    default:            return 'badge badge-unknown';
  }
}

export default function AdminPage() {
  const { user } = useAuth();
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await axios.get('/api/checkouts');
      setCheckouts(res.data);
    } catch {
      setCheckouts(STUB);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id, status) {
    const label = status === 'approved' ? 'approve' : 'deny';
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} this request?`)) return;
    setActing(id + status);
    try {
      const res = await axios.patch(`/api/checkouts/${id}/status`, { status });
      setCheckouts((prev) =>
        prev.map((c) => (c.id === id ? res.data : c))
      );
    } catch {
      alert(`Could not ${label} request. Please try again.`);
    } finally {
      setActing(null);
    }
  }

  const pending = checkouts.filter((c) => c.status === 'pending');
  const filtered = statusFilter
    ? checkouts.filter((c) => c.status === statusFilter)
    : checkouts;

  if (!user?.isAdmin && !user?.isManager) {
    return (
      <div className="alert alert-danger" style={{ marginTop: 24 }}>
        Access denied. Manager or Admin role required.
      </div>
    );
  }

  if (loading) return <div className="loading">Loading admin data…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Admin — Checkout Management</h1>
      </div>

      {/* Pending Approvals Queue */}
      <div className="card">
        <div className="card-header">
          Pending Approvals
          {pending.length > 0 && (
            <span className="badge badge-warn" style={{ marginLeft: 8 }}>
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="empty-state">No pending approvals</div>
        ) : (
          pending.map((c) => (
            <div key={c.id} className="approval-row">
              <div>
                <strong>{c.checkout_number}</strong> &mdash; {c.employee_name}
                <br />
                <span style={{ color: 'var(--saws-text-muted)', fontSize: 13 }}>
                  {c.vehicle_name} ({c.vehicle_plate}) &bull;{' '}
                  {c.checkout_date} &rarr; {c.return_date} &bull;{' '}
                  <span style={{ textTransform: 'capitalize' }}>{c.purpose}</span>
                </span>
              </div>
              <div className="approval-actions">
                <button
                  className="btn btn-sm btn-success"
                  disabled={!!acting}
                  onClick={() => handleAction(c.id, 'approved')}
                >
                  {acting === c.id + 'approved' ? '…' : 'Approve'}
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  disabled={!!acting}
                  onClick={() => handleAction(c.id, 'denied')}
                >
                  {acting === c.id + 'denied' ? '…' : 'Deny'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full Checkout History */}
      <div className="card">
        <div className="card-header">Checkout History</div>
        <div className="filters-bar">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="checked-out">Checked Out</option>
            <option value="returned">Returned</option>
            <option value="denied">Denied</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">No records match the selected filter</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Employee</th>
                <th>Vehicle</th>
                <th>Purpose</th>
                <th>Checkout</th>
                <th>Return</th>
                <th>Status</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.checkout_number}</td>
                  <td>{c.employee_name}</td>
                  <td>
                    {c.vehicle_name}
                    <br />
                    <span style={{ color: 'var(--saws-text-muted)', fontSize: 12 }}>
                      {c.vehicle_plate}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{c.purpose}</td>
                  <td>{c.checkout_date}</td>
                  <td>{c.return_date}</td>
                  <td>
                    <span className={statusBadgeClass(c.status)}>{c.status}</span>
                  </td>
                  <td>{c.approved_by || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
