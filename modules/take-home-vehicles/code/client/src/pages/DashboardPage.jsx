import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

const today = new Date().toISOString().slice(0, 10);

const STUB_CHECKOUTS = [
  {
    id: 1,
    checkout_number: 'THV-2026-001',
    vehicle_name: '2023 Ford F-150',
    vehicle_plate: 'F-150-01',
    employee_name: 'John Smith',
    approved_by: 'Maria Garcia',
    return_date: today,
    status: 'checked-out',
    _stub: true,
  },
  {
    id: 2,
    checkout_number: 'THV-2026-002',
    vehicle_name: '2022 RAM 1500',
    vehicle_plate: 'R-001',
    employee_name: 'Maria Garcia',
    approved_by: 'Fleet Manager',
    return_date: today,
    status: 'approved',
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await axios.get('/api/checkouts');
      setCheckouts(res.data);
    } catch {
      setCheckouts(STUB_CHECKOUTS);
    } finally {
      setLoading(false);
    }
  }

  const checkedOutTonight = checkouts.filter(
    (c) => c.status === 'checked-out' && c.return_date === today
  ).length;
  const pendingApprovals = checkouts.filter((c) => c.status === 'pending').length;
  const dueBackToday = checkouts.filter(
    (c) => (c.status === 'approved' || c.status === 'checked-out') && c.return_date === today
  ).length;
  const overdue = checkouts.filter(
    (c) =>
      (c.status === 'approved' || c.status === 'checked-out') &&
      c.return_date < today
  ).length;

  const active = checkouts.filter(
    (c) => c.status === 'checked-out' && c.return_date === today
  );

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Fleet Dashboard</h1>
        <span style={{ color: 'var(--saws-text-muted)', fontSize: 13 }}>
          Welcome, {user?.name}
        </span>
      </div>

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-value">{checkedOutTonight}</div>
          <div className="stat-label">Vehicles Checked Out Tonight</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{pendingApprovals}</div>
          <div className="stat-label">Pending Approvals</div>
        </div>
        <div className="stat-card green">
          <div className="stat-value">{dueBackToday}</div>
          <div className="stat-label">Due Back Today</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Tonight's Active Checkouts</div>
        {active.length === 0 ? (
          <div className="empty-state">No vehicles checked out tonight</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Employee</th>
                <th>Approved By</th>
                <th>Return Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {active.map((c) => (
                <tr key={c.id}>
                  <td>{c.checkout_number}</td>
                  <td>{c.vehicle_name}</td>
                  <td>{c.vehicle_plate}</td>
                  <td>{c.employee_name}</td>
                  <td>{c.approved_by || '—'}</td>
                  <td>{c.return_date}</td>
                  <td>
                    <span className={statusBadgeClass(c.status)}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
