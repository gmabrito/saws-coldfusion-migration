import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

// Fleet: Add/edit vehicle form
export default function VehicleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    vehicleNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    departmentId: '',
    status: 'Active',
    mileage: 0,
    assignedEmployeeId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      const v = response.data;
      setForm({
        vehicleNumber: v.VehicleNumber || '',
        make: v.Make || '',
        model: v.Model || '',
        year: v.Year || new Date().getFullYear(),
        vin: v.VIN || '',
        departmentId: v.DepartmentID || '',
        status: v.Status || 'Active',
        mileage: v.Mileage || 0,
        assignedEmployeeId: v.AssignedEmployeeID || ''
      });
    } catch (err) {
      setError('Failed to load vehicle');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        year: parseInt(form.year),
        mileage: parseInt(form.mileage) || 0,
        departmentId: form.departmentId ? parseInt(form.departmentId) : null,
        assignedEmployeeId: form.assignedEmployeeId ? parseInt(form.assignedEmployeeId) : null
      };

      if (isEdit) {
        await api.put(`/vehicles/${id}`, payload);
      } else {
        const response = await api.post('/vehicles', payload);
        navigate(`/vehicles/${response.data.vehicleId}`);
        return;
      }

      navigate(`/vehicles/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>
        <Link to={isEdit ? `/vehicles/${id}` : '/'} className="btn btn-secondary">Cancel</Link>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicleNumber">Vehicle Number *</label>
              <input id="vehicleNumber" name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select id="status" name="status" value={form.status} onChange={handleChange} required>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="make">Make *</label>
              <input id="make" name="make" value={form.make} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="model">Model *</label>
              <input id="model" name="model" value={form.model} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Year *</label>
              <input id="year" name="year" type="number" min="1990" max="2030" value={form.year} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="vin">VIN</label>
              <input id="vin" name="vin" value={form.vin} onChange={handleChange} maxLength={17} placeholder="17-character VIN" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="mileage">Current Mileage</label>
              <input id="mileage" name="mileage" type="number" min="0" value={form.mileage} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="departmentId">Department ID</label>
              <input id="departmentId" name="departmentId" type="number" value={form.departmentId} onChange={handleChange} placeholder="Department ID" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="assignedEmployeeId">Assigned Employee ID</label>
            <input id="assignedEmployeeId" name="assignedEmployeeId" type="number" value={form.assignedEmployeeId} onChange={handleChange} placeholder="Employee ID" />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
            <Link to={isEdit ? `/vehicles/${id}` : '/'} className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
