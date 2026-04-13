import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';

export default function JobRequestPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: 1,
    paperSize: 'Letter (8.5x11)',
    colorType: 'Black & White',
    departmentId: '',
    rushOrder: false,
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await jobService.create(formData);
      navigate(`/jobs/${res.data.jobId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit print job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>Submit Print Job Request</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Job Title *</label>
          <input id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange}
            placeholder="Describe the print job details, special instructions, etc." />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input id="quantity" name="quantity" type="number" min="1" value={formData.quantity} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="paperSize">Paper Size *</label>
            <select id="paperSize" name="paperSize" value={formData.paperSize} onChange={handleChange}>
              <option>Letter (8.5x11)</option>
              <option>Legal (8.5x14)</option>
              <option>Tabloid (11x17)</option>
              <option>A4</option>
              <option>Custom</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="colorType">Color Type *</label>
            <select id="colorType" name="colorType" value={formData.colorType} onChange={handleChange}>
              <option>Black & White</option>
              <option>Color</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="departmentId">Department *</label>
            <select id="departmentId" name="departmentId" value={formData.departmentId} onChange={handleChange} required>
              <option value="">Select Department</option>
              <option value="1">Administration</option>
              <option value="2">Engineering</option>
              <option value="3">Finance</option>
              <option value="4">Human Resources</option>
              <option value="5">Information Services</option>
              <option value="6">Operations</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input type="checkbox" id="rushOrder" name="rushOrder" checked={formData.rushOrder} onChange={handleChange} />
            <label htmlFor="rushOrder" style={{ marginBottom: 0 }}>Rush Order (requires admin approval)</label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Additional Notes</label>
          <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange}
            placeholder="Any additional instructions for the print shop" />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Print Request'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/jobs')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
