import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contractService } from '../services/api';

export default function ContractListPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadContracts();
  }, [statusFilter]);

  const loadContracts = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await contractService.getAll(params);
      setContracts(data);
    } catch (err) {
      setError('Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      Pending: 'badge badge-pending',
      Approved: 'badge badge-approved',
      Denied: 'badge badge-denied',
    };
    return <span className={classes[status] || 'badge'}>{status}</span>;
  };

  if (loading) return <div className="page"><p>Loading contracts...</p></div>;

  return (
    <div className="page">
      <h2>Fire Hydrant Meter Contracts</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <div className="form-group">
          <label>Filter by Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Denied">Denied</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Business</th>
              <th>Meter Size</th>
              <th>Location</th>
              <th>Status</th>
              <th>Applied</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: '#666' }}>No contracts found.</td></tr>
            ) : (
              contracts.map((c) => (
                <tr key={c.ContractID}>
                  <td>{c.ContractID}</td>
                  <td>{c.ApplicantName}</td>
                  <td>{c.BusinessName}</td>
                  <td>{c.MeterSize}</td>
                  <td>{c.MeterLocation}</td>
                  <td>{getStatusBadge(c.Status)}</td>
                  <td>{new Date(c.ApplicationDate).toLocaleDateString()}</td>
                  <td><Link to={`/contracts/${c.ContractID}`} className="btn btn-sm btn-primary">View</Link></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
