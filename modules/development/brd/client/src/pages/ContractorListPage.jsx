import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { contractorService } from '../services/api';

export default function ContractorListPage() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadContractors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.licenseType = typeFilter;

      const res = await contractorService.list(params);
      setContractors(res.data);
    } catch (err) {
      setError('Failed to load contractors');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    loadContractors();
  }, [loadContractors]);

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to remove this contractor?')) return;
    try {
      await contractorService.delete(id);
      setContractors((prev) => prev.filter((c) => c.ContractorID !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove contractor');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  function statusBadge(status) {
    const cls = {
      Active: 'badge-active',
      Inactive: 'badge-inactive',
      Suspended: 'badge-suspended',
      Expired: 'badge-expired',
    }[status] || '';
    return <span className={`badge ${cls}`}>{status}</span>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>Authorized Contractor / Plumber Registry</h2>
        <Link to="/contractors/new" className="btn btn-primary">+ Register Contractor</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* BRD 7.2 - Search and filter */}
      <div className="filter-bar">
        <input
          className="form-control"
          placeholder="Search by company, name, or license..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
          <option value="Expired">Expired</option>
        </select>
        <select
          className="form-control"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="Contractor">Contractor</option>
          <option value="Plumber">Plumber</option>
          <option value="Both">Both</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading contractors...</div>
      ) : contractors.length === 0 ? (
        <div className="empty-state">No contractors found. Register a new contractor to get started.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>License #</th>
              <th>Type</th>
              <th>Authorized</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contractors.map((c) => (
              <tr key={c.ContractorID}>
                <td>{c.CompanyName}</td>
                <td>{c.ContactName}</td>
                <td>{c.Phone}</td>
                <td>{c.LicenseNumber}</td>
                <td>{c.LicenseType}</td>
                <td>{formatDate(c.AuthorizationDate)}</td>
                <td>{formatDate(c.ExpirationDate)}</td>
                <td>{statusBadge(c.Status)}</td>
                <td>
                  <div className="actions-row">
                    <Link to={`/contractors/${c.ContractorID}/edit`} className="btn btn-sm btn-primary">Edit</Link>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.ContractorID)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
