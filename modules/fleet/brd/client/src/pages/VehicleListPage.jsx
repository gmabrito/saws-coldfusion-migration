import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Fleet: List vehicles with status badges, search by number/department
export default function VehicleListPage() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/vehicles', { params });
      setVehicles(response.data);
    } catch (err) {
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const getStatusBadge = (status) => {
    const classes = {
      Active: 'badge-active',
      Maintenance: 'badge-maintenance',
      Retired: 'badge-retired'
    };
    return <span className={`badge ${classes[status] || ''}`}>{status}</span>;
  };

  const formatMileage = (miles) => {
    return miles ? miles.toLocaleString() : '0';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Fleet Vehicles</h1>
        <Link to="/vehicles/new" className="btn btn-primary">Add Vehicle</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Search by vehicle number, make, model, or VIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Retired">Retired</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', textAlign: 'center' }}>Loading...</p>
        ) : vehicles.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: 'var(--saws-text-light)' }}>
            No vehicles found.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Vehicle #</th>
                <th>Year / Make / Model</th>
                <th>Department</th>
                <th>Assigned To</th>
                <th>Mileage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.VehicleID}>
                  <td>
                    <Link to={`/vehicles/${v.VehicleID}`} style={{ fontWeight: 600 }}>
                      {v.VehicleNumber}
                    </Link>
                  </td>
                  <td>{v.Year} {v.Make} {v.Model}</td>
                  <td>{v.DepartmentName || 'Unassigned'}</td>
                  <td>{v.AssignedEmployee || 'Unassigned'}</td>
                  <td>{formatMileage(v.Mileage)}</td>
                  <td>{getStatusBadge(v.Status)}</td>
                  <td>
                    <Link to={`/vehicles/${v.VehicleID}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px' }}>
                      View
                    </Link>
                    <Link to={`/vehicles/${v.VehicleID}/edit`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                      Edit
                    </Link>
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
