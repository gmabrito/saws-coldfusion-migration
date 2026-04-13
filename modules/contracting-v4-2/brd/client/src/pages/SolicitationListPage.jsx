import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { solicitationService } from '../services/api';

const STATUS_OPTIONS = ['All', 'Open', 'Closed', 'Awarded'];
const TYPE_OPTIONS = [
  'All',
  'Invitation for Bid',
  'Request for Proposal',
  'Request for Qualification',
];

function formatDate(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function StatusBadge({ status }) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}

export default function SolicitationListPage() {
  const [solicitations, setSolicitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortField, setSortField] = useState('PostedDate');
  const [sortDir, setSortDir] = useState('desc');

  const fetchSolicitations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (typeFilter !== 'All') params.type = typeFilter;
      const res = await solicitationService.list(params);
      setSolicitations(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load solicitations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchSolicitations();
  }, [fetchSolicitations]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...solicitations].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (aVal == null) aVal = '';
    if (bVal == null) bVal = '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const sortIndicator = (field) => {
    if (sortField !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Solicitations</h2>
        <Link to="/solicitations/new" className="btn btn-primary">+ New Solicitation</Link>
      </div>

      <div className="filter-bar">
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
          ))}
        </select>
        <select
          className="form-control"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading solicitations...</div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">No solicitations found.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('Title')}>
                Title<span className="sort-indicator">{sortIndicator('Title')}</span>
              </th>
              <th onClick={() => handleSort('SolicitationType')}>
                Type<span className="sort-indicator">{sortIndicator('SolicitationType')}</span>
              </th>
              <th onClick={() => handleSort('PostedDate')}>
                Posted<span className="sort-indicator">{sortIndicator('PostedDate')}</span>
              </th>
              <th onClick={() => handleSort('Deadline')}>
                Deadline<span className="sort-indicator">{sortIndicator('Deadline')}</span>
              </th>
              <th onClick={() => handleSort('Status')}>
                Status<span className="sort-indicator">{sortIndicator('Status')}</span>
              </th>
              <th>Docs</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((sol) => (
              <tr key={sol.SolicitationID}>
                <td>
                  <Link to={`/solicitations/${sol.SolicitationID}`}>{sol.Title}</Link>
                </td>
                <td>{sol.SolicitationType}</td>
                <td>{formatDate(sol.PostedDate)}</td>
                <td>{formatDate(sol.Deadline)}</td>
                <td><StatusBadge status={sol.Status} /></td>
                <td>{sol.DocumentCount || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
