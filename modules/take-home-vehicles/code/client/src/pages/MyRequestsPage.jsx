import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../components/AuthContext';

const today = new Date().toISOString().slice(0, 10);

const STUB = [
  {
    id: 1,
    checkout_number: 'THV-2026-001',
    vehicle_name: '2023 Ford F-150',
    vehicle_plate: 'F-150-01',
    checkout_date: today,
    return_date: today,
    purpose: 'after-hours duty',
    status: 'checked-out',
    _stub: true,
  },
  {
    id: 3,
    checkout_number: 'THV-2026-003',
    vehicle_name: '2021 Chevy Silverado',
    vehicle_plate: 'S-003',
    checkout_date: today,
    return_date: today,
    purpose: 'job site',
    status: 'pending',
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

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await axios.get('/api/checkouts', {
        params: { employee_id: user?.id },
      });
      setRequests(res.data);
    } catch {
      setRequests(STUB);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this request?')) return;
    setCancelling(id);
    try {
      await axios.patch(`/api/checkouts/${id}/status`, { status: 'denied' });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'denied' } : r))
      );
    } catch {
      alert('Could not cancel request. Please try again.');
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return <div className="loading">Loading your requests…</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Requests</h1>
        <Link to="/request/new" className="btn btn-primary">+ New Request</Link>
      </div>

      {requests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            You have no checkout requests.{' '}
            <Link to="/request/new">Submit one now.</Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Purpose</th>
                <th>Checkout</th>
                <th>Return</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.checkout_number}</td>
                  <td>{r.vehicle_name}</td>
                  <td>{r.vehicle_plate}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.purpose}</td>
                  <td>{r.checkout_date}</td>
                  <td>{r.return_date}</td>
                  <td>
                    <span className={statusBadgeClass(r.status)}>{r.status}</span>
                  </td>
                  <td>
                    {r.status === 'pending' && (
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={cancelling === r.id}
                        onClick={() => handleCancel(r.id)}
                      >
                        {cancelling === r.id ? '…' : 'Cancel'}
                      </button>
                    )}
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
