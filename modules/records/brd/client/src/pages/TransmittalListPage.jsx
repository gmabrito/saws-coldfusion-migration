import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { transmittalService } from '../services/api';

function StatusBadge({ status }) {
  const classMap = {
    Draft: 'badge-draft',
    Submitted: 'badge-submitted',
    Reviewed: 'badge-reviewed',
    'In Storage': 'badge-in-storage',
    Disposed: 'badge-disposed'
  };
  return <span className={`badge ${classMap[status] || ''}`}>{status}</span>;
}

export default function TransmittalListPage() {
  const [transmittals, setTransmittals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchTransmittals = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, pageSize: 20 };
      if (statusFilter) params.status = statusFilter;
      const response = await transmittalService.list(params);
      setTransmittals(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load transmittals.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTransmittals(1);
  }, [fetchTransmittals]);

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Records Transmittals</h2>
          <button className="btn btn-primary" onClick={() => navigate('/transmittals/new')}>
            + New Transmittal
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontWeight: 600, fontSize: '13px', color: '#005A87' }}>Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #dee2e6', fontSize: '14px' }}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Reviewed">Reviewed</option>
            <option value="In Storage">In Storage</option>
            <option value="Disposed">Disposed</option>
          </select>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading transmittals...</p>
          </div>
        ) : transmittals.length === 0 ? (
          <div className="empty-state">
            <p>No transmittals found.</p>
            <button className="btn btn-primary" onClick={() => navigate('/transmittals/new')}>
              Create Your First Transmittal
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Submitted By</th>
                    <th>Submit Date</th>
                    <th>Status</th>
                    <th>Boxes</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {transmittals.map((t) => (
                    <tr
                      key={t.TransmittalID}
                      className="clickable"
                      onClick={() => navigate(`/transmittals/${t.TransmittalID}`)}
                    >
                      <td>{t.TransmittalID}</td>
                      <td>{t.DepartmentName}</td>
                      <td>{t.SubmittedByName}</td>
                      <td>{formatDate(t.SubmitDate)}</td>
                      <td><StatusBadge status={t.Status} /></td>
                      <td>{t.BoxCount}</td>
                      <td>{t.Notes ? (t.Notes.length > 50 ? t.Notes.substring(0, 50) + '...' : t.Notes) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchTransmittals(pagination.page - 1)}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchTransmittals(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
