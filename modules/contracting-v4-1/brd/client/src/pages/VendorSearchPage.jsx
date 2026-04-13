import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { vendorService } from '../services/api';

// Ref: BRD 6.1 - search vendor profiles, export to Excel spreadsheets

export default function VendorSearchPage() {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ name: '', category: '', status: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchVendors = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: pagination.limit };
      if (filters.name.trim()) params.name = filters.name.trim();
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;

      const data = await vendorService.search(params);
      setVendors(data.vendors);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    vendorService.getCategories()
      .then(setCategories)
      .catch(() => {});
    fetchVendors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVendors(1);
  };

  const handleReset = () => {
    setFilters({ name: '', category: '', status: '' });
    // Fetch with cleared filters on next render
    setTimeout(() => fetchVendors(1), 0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (filters.name.trim()) params.name = filters.name.trim();
      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      await vendorService.exportCsv(params);
    } catch (err) {
      setError('Failed to export vendors');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove vendor "${name}"?`)) return;
    try {
      await vendorService.remove(id);
      fetchVendors(pagination.page);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove vendor');
    }
  };

  const renderStatusBadge = (status) => {
    const cls = status === 'Active' ? 'badge-active'
      : status === 'Inactive' ? 'badge-inactive'
      : 'badge-pending';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <div>
      {/* Search Filters */}
      <div className="card">
        <h2 className="card-title">Search Vendors</h2>
        <form onSubmit={handleSearch}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="searchName">Business or Contact Name</label>
              <input
                id="searchName"
                type="text"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                placeholder="Search by name..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="searchCategory">Category</label>
              <select
                id="searchCategory"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryName}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="searchStatus">Status</label>
              <select
                id="searchStatus"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="btn-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Results */}
      <div className="card">
        <div className="action-bar">
          <h2 className="card-title" style={{ marginBottom: 0 }}>
            Results ({pagination.total} vendors)
          </h2>
          <button
            className="btn btn-success btn-sm"
            onClick={handleExport}
            disabled={exporting || vendors.length === 0}
          >
            {exporting ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <div className="loading">No vendors found. Try adjusting your search criteria.</div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Contact Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.VendorID}>
                      <td>
                        <Link to={`/vendors/${v.VendorID}`} style={{ color: 'var(--saws-blue)' }}>
                          {v.BusinessName}
                        </Link>
                      </td>
                      <td>{v.ContactName}</td>
                      <td>{v.Email}</td>
                      <td>{v.Phone}</td>
                      <td>{v.CategoryName || '-'}</td>
                      <td>{renderStatusBadge(v.Status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link to={`/vendors/${v.VendorID}/edit`} className="btn btn-warning btn-sm">
                            Edit
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(v.VendorID, v.BusinessName)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => fetchVendors(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchVendors(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
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
