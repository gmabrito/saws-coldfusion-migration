import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

// Fleet: Log maintenance entry (date, type, description, cost, mileage)
export default function MaintenanceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    maintenanceDate: new Date().toISOString().split('T')[0],
    maintenanceType: '',
    description: '',
    cost: '',
    mileage: '',
    performedBy: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maintenanceTypes = [
    'Oil Change',
    'Tire Rotation',
    'Brake Service',
    'Engine Repair',
    'Transmission Service',
    'Battery Replacement',
    'Scheduled Inspection',
    'Body Repair',
    'Electrical Repair',
    'Fluid Service',
    'Filter Replacement',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(`/vehicles/${id}/maintenance`, {
        maintenanceDate: form.maintenanceDate,
        maintenanceType: form.maintenanceType,
        description: form.description,
        cost: parseFloat(form.cost),
        mileage: parseInt(form.mileage),
        performedBy: form.performedBy || null
      });

      navigate(`/vehicles/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to log maintenance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Log Maintenance Entry</h1>
        <Link to={`/vehicles/${id}`} className="btn btn-secondary">Back to Vehicle</Link>
      </div>

      <div className="card">
        <p style={{ color: 'var(--saws-text-light)', marginBottom: '20px' }}>
          Vehicle ID: {id} -- Record a new maintenance entry below.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="maintenanceDate">Maintenance Date *</label>
              <input
                id="maintenanceDate"
                name="maintenanceDate"
                type="date"
                value={form.maintenanceDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="maintenanceType">Maintenance Type *</label>
              <select
                id="maintenanceType"
                name="maintenanceType"
                value={form.maintenanceType}
                onChange={handleChange}
                required
              >
                <option value="">Select type...</option>
                {maintenanceTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the maintenance performed..."
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cost">Cost ($) *</label>
              <input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="mileage">Mileage at Service *</label>
              <input
                id="mileage"
                name="mileage"
                type="number"
                min="0"
                value={form.mileage}
                onChange={handleChange}
                placeholder="Current odometer reading"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="performedBy">Performed By</label>
            <input
              id="performedBy"
              name="performedBy"
              value={form.performedBy}
              onChange={handleChange}
              placeholder="Name of technician or shop"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn btn-orange" disabled={loading}>
              {loading ? 'Saving...' : 'Log Maintenance Entry'}
            </button>
            <Link to={`/vehicles/${id}`} className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
