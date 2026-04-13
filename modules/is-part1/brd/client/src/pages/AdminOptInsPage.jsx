import { useState, useEffect } from 'react';
import api from '../services/api';

// BRD 7.3: Admin report view of all opt-ins with search/filter
export default function AdminOptInsPage() {
  const [optins, setOptins] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchOptIns();
  }, []);

  const fetchOptIns = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.isActive = statusFilter;
      const response = await api.get('/optins', { params });
      setOptins(response.data);
    } catch (err) {
      setError('Failed to load opt-ins');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOptIns();
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Are you sure you want to deactivate this opt-in?')) return;
    try {
      await api.delete(`/optins/${id}`);
      fetchOptIns();
    } catch (err) {
      setError('Failed to deactivate opt-in');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatPhone = (phone) => {
    if (!phone || phone.length !== 10) return phone;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1>SMS Opt-in Administration</h1>
        <span className="badge badge-active">{optins.length} Total Records</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* BRD 7.3: Search and filter controls */}
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Search by name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {/* BRD 7.3: Opt-in report table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', textAlign: 'center' }}>Loading...</p>
        ) : optins.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: 'var(--saws-text-light)' }}>
            No opt-in records found.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Phone Number</th>
                <th>Consent Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {optins.map((optin) => (
                <>
                  <tr key={optin.OptInID}>
                    <td>
                      <strong>{optin.FirstName} {optin.LastName}</strong>
                      <br />
                      <small style={{ color: 'var(--saws-text-light)' }}>{optin.Department}</small>
                    </td>
                    <td>{formatPhone(optin.PhoneNumber)}</td>
                    <td>{formatDate(optin.ConsentDate)}</td>
                    <td>
                      <span className={`badge ${optin.IsActive ? 'badge-active' : 'badge-inactive'}`}>
                        {optin.IsActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px' }}
                        onClick={() => toggleExpand(optin.OptInID)}
                      >
                        {expandedId === optin.OptInID ? 'Hide' : 'Details'}
                      </button>
                      {optin.IsActive && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => handleDeactivate(optin.OptInID)}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === optin.OptInID && (
                    <tr key={`${optin.OptInID}-detail`}>
                      <td colSpan={5} style={{ backgroundColor: 'var(--saws-light-gray)', padding: '16px' }}>
                        <strong>Notification Preferences:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                          {optin.preferences?.map((pref) => (
                            <li key={pref.PreferenceID} style={{ marginBottom: '4px' }}>
                              {pref.NotificationType}: {' '}
                              <span className={`badge ${pref.IsEnabled ? 'badge-active' : 'badge-inactive'}`}>
                                {pref.IsEnabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--saws-text-light)' }}>
                          Email: {optin.Email || 'N/A'} | Created: {formatDate(optin.CreatedDate)}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
