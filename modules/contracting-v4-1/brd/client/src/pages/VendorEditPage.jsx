import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vendorService } from '../services/api';

// Ref: BRD 6.1 - edit / update contact information

export default function VendorEditPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    categoryId: '',
    status: 'Pending',
    notes: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    vendorService.getCategories()
      .then(setCategories)
      .catch(() => {});

    if (!isNew) {
      vendorService.getById(id)
        .then((data) => {
          setFormData({
            businessName: data.BusinessName || '',
            contactName: data.ContactName || '',
            email: data.Email || '',
            phone: data.Phone || '',
            address: data.Address || '',
            city: data.City || '',
            state: data.State || '',
            zip: data.Zip || '',
            categoryId: data.CategoryID || '',
            status: data.Status || 'Pending',
            notes: data.Notes || ''
          });
        })
        .catch((err) => setError(err.response?.data?.error || 'Failed to load vendor'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error on change
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
    if (!formData.contactName.trim()) errors.contactName = 'Contact name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (formData.state && formData.state.length !== 2) {
      errors.state = 'State must be 2 characters (e.g., TX)';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId ? parseInt(formData.categoryId, 10) : null
      };

      if (isNew) {
        const result = await vendorService.create(payload);
        setSuccess('Vendor created successfully');
        setTimeout(() => navigate(`/vendors/${result.vendorId}`), 1500);
      } else {
        await vendorService.update(id, payload);
        setSuccess('Vendor updated successfully');
        setTimeout(() => navigate(`/vendors/${id}`), 1500);
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        // Express-validator errors
        const fieldErrors = {};
        err.response.data.errors.forEach((e) => {
          if (e.path) fieldErrors[e.path] = e.msg;
        });
        setValidationErrors(fieldErrors);
      } else {
        setError(err.response?.data?.error || `Failed to ${isNew ? 'create' : 'update'} vendor`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading vendor...</div>;
  }

  return (
    <div>
      <h2 className="card-title">{isNew ? 'Add New Vendor' : 'Edit Vendor'}</h2>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="businessName">Business Name *</label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleChange}
                maxLength={200}
              />
              {validationErrors.businessName && (
                <small style={{ color: 'var(--saws-danger)' }}>{validationErrors.businessName}</small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="contactName">Contact Name *</label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                value={formData.contactName}
                onChange={handleChange}
                maxLength={150}
              />
              {validationErrors.contactName && (
                <small style={{ color: 'var(--saws-danger)' }}>{validationErrors.contactName}</small>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              {validationErrors.email && (
                <small style={{ color: 'var(--saws-danger)' }}>{validationErrors.email}</small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                maxLength={20}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                maxLength={255}
              />
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                maxLength={100}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                maxLength={2}
                placeholder="TX"
              />
              {validationErrors.state && (
                <small style={{ color: 'var(--saws-danger)' }}>{validationErrors.state}</small>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="zip">Zip</label>
              <input
                id="zip"
                name="zip"
                type="text"
                value={formData.zip}
                onChange={handleChange}
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label htmlFor="categoryId">Category</label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.CategoryID} value={cat.CategoryID}>
                    {cat.CategoryName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="btn-group">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Create Vendor' : 'Save Changes'}
            </button>
            <Link to={isNew ? '/' : `/vendors/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
