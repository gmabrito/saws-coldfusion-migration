import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import StatusBadge from '../../components/StatusBadge';

const STATUSES = ['', 'submitted', 'acknowledged', 'in_review', 'pending_response', 'completed', 'denied', 'partial'];
const LIMIT = 25;

export default function RequestQueuePage() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const filters = { page, limit: LIMIT };
    if (status) filters.status = status;
    if (assignedToMe) filters.assignedToMe = true;
    if (overdueOnly) filters.overdue = true;

    requestService.getQueue(filters)
      .then((data) => {
        setRequests(data.requests || []);
        setTotal(data.total || 0);
      })
      .catch(() => setError('Failed to load request queue.'))
      .finally(() => setLoading(false));
  }, [page, status, assignedToMe, overdueOnly]);

  const totalPages = Math.ceil(total / LIMIT);

  function daysElapsed(dateStr) {
    const ms = Date.now() - new Date(dateStr).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Request Queue</h1>
        <span style={{ color: 'var(--saws-text-muted)', fontSize: 14 }}>
          {total} total request{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="filters-bar">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => { setAssignedToMe(e.target.checked); setPage(1); }}
          />
          Assigned to me
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1); }}
          />
          Overdue only
        </label>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Confirmation #</th>
                <th>Requester</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Days Elapsed</th>
                <th>Assigned To</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--saws-text-muted)' }}>
                    No requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const days = daysElapsed(req.submitted_at);
                  const isOverdue = new Date(req.due_date) < new Date() &&
                    !['completed', 'denied', 'partial'].includes(req.status);
                  return (
                    <tr key={req.id} className="clickable-row">
                      <td>
                        <Link to={`/internal/requests/${req.id}`} style={{ fontFamily: 'monospace' }}>
                          {req.confirmation_no}
                        </Link>
                      </td>
                      <td>{req.requester_name}</td>
                      <td style={{ fontSize: 12 }}>
                        {new Date(req.submitted_at).toLocaleDateString()}
                      </td>
                      <td><StatusBadge status={req.status} /></td>
                      <td className={isOverdue ? 'overdue' : ''}>{days} days</td>
                      <td style={{ fontSize: 12, color: 'var(--saws-text-muted)' }}>
                        {req.assigned_to || '—'}
                      </td>
                      <td style={{ fontSize: 12 }} className={isOverdue ? 'overdue' : ''}>
                        {new Date(req.due_date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(1)} disabled={page === 1}>&laquo;</button>
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>&lsaquo;</button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>&rsaquo;</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>&raquo;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
