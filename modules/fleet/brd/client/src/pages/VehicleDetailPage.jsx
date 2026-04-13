import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

// Fleet: Vehicle detail with maintenance history table
export default function VehicleDetailPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      setVehicle(response.data);
    } catch (err) {
      setError('Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      Active: 'badge-active',
      Maintenance: 'badge-maintenance',
      Retired: 'badge-retired'
    };
    return <span className={`badge ${classes[status] || ''}`}>{status}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const formatMileage = (miles) => {
    return miles ? miles.toLocaleString() : '0';
  };

  if (loading) return <div className="container"><p>Loading...</p></div>;
  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!vehicle) return <div className="container"><p>Vehicle not found.</p></div>;

  const totalMaintenanceCost = vehicle.maintenanceHistory?.reduce((sum, m) => sum + (m.Cost || 0), 0) || 0;

  return (
    <div>
      <div className="page-header">
        <h1>Vehicle: {vehicle.VehicleNumber}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to={`/vehicles/${id}/edit`} className="btn btn-primary">Edit Vehicle</Link>
          <Link to={`/vehicles/${id}/maintenance`} className="btn btn-orange">Log Maintenance</Link>
          <Link to="/" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>

      {/* Vehicle details */}
      <div className="card">
        <h2 style={{ color: 'var(--saws-navy)', marginBottom: '16px' }}>Vehicle Information</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Vehicle Number</label>
            <div className="value">{vehicle.VehicleNumber}</div>
          </div>
          <div className="detail-item">
            <label>Status</label>
            <div className="value">{getStatusBadge(vehicle.Status)}</div>
          </div>
          <div className="detail-item">
            <label>Year / Make / Model</label>
            <div className="value">{vehicle.Year} {vehicle.Make} {vehicle.Model}</div>
          </div>
          <div className="detail-item">
            <label>VIN</label>
            <div className="value">{vehicle.VIN || 'N/A'}</div>
          </div>
          <div className="detail-item">
            <label>Department</label>
            <div className="value">{vehicle.DepartmentName || 'Unassigned'}</div>
          </div>
          <div className="detail-item">
            <label>Assigned Employee</label>
            <div className="value">{vehicle.AssignedEmployee || 'Unassigned'}</div>
          </div>
          <div className="detail-item">
            <label>Current Mileage</label>
            <div className="value">{formatMileage(vehicle.Mileage)} mi</div>
          </div>
          <div className="detail-item">
            <label>Total Maintenance Cost</label>
            <div className="value">{formatCurrency(totalMaintenanceCost)}</div>
          </div>
        </div>
      </div>

      {/* Maintenance history */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--saws-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: 'var(--saws-navy)', fontSize: '18px' }}>Maintenance History</h2>
          <Link to={`/vehicles/${id}/maintenance`} className="btn btn-orange" style={{ padding: '6px 14px', fontSize: '13px' }}>
            Log Entry
          </Link>
        </div>

        {!vehicle.maintenanceHistory || vehicle.maintenanceHistory.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: 'var(--saws-text-light)' }}>
            No maintenance records found.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Cost</th>
                <th>Mileage</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {vehicle.maintenanceHistory.map((entry) => (
                <tr key={entry.LogID}>
                  <td>{formatDate(entry.MaintenanceDate)}</td>
                  <td><strong>{entry.MaintenanceType}</strong></td>
                  <td>{entry.Description}</td>
                  <td>{formatCurrency(entry.Cost)}</td>
                  <td>{formatMileage(entry.Mileage)}</td>
                  <td>{entry.PerformedBy || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
