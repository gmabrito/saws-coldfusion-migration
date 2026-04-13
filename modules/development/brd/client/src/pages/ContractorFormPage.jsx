import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { contractorService } from '../services/api';

const INITIAL_FORM = {
  companyName: '',
  contactName: '',
  phone: '',
  email: '',
  licenseNumber: '',
  licenseType: 'Contractor',
  authorizationDate: '',
  expirationDate: '',
  status: 'Active',
  notes: '',
};

export default function ContractorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      contractorService.get(id)
        .then((res) => {
          const c = res.data;
          setForm({
            companyName: c.CompanyName || '',
            contactName: c.ContactName || '',
            phone: c.Phone || '',
            email: c.Email || '',
            licenseNumber: c.LicenseNumber || '',
            licenseType: c.LicenseType || 'Contractor',
            authorizationDate: c.AuthorizationDate ? c.AuthorizationDate.substring(0, 10) : '',
            expirationDate: c.ExpirationDate ? c.ExpirationDate.substring(0, 10) : '',
            status: c.Status || 'Active',
            notes: c.Notes || '',
          });
        })
        .catch(() => setError('Failed to load contractor'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  function validate() {
    const errs = {};
    if (!form.companyName.trim()) errs.companyName = 'Company name is required';
    if (!form.contactName.trim()) errs.contactName = 'Contact name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.licenseNumber.trim()) errs.licenseNumber = 'License number is required';
    if (!form.authorizationDate) errs.authorizationDate = 'Authorization date is required';
    if (!form.expirationDate) errs.expirationDate = 'Expiration date is required';
    if (form.authorizationDate && form.expirationDate && form.expirationDate < form.authorizationDate) {
      errs.expirationDate = 'Expiration must be after authorization date';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await contractorService.update(id, form);
      } else {
        await contractorService.create(form);
      }
      navigate('/contractors');
    } catch (err) {
      if (err.response?.data?.errors) {
        const mapped = {};
        err.response.data.errors.forEach((e) => { mapped[e.path] = e.msg; });
        setFieldErrors(mapped);
      } else {
        setError(err.response?.data?.error || 'Failed to save contractor');
      }
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  }

  function FieldError({ field }) {
    return fieldErrors[field]
      ? <small style={{ color: 'var(--saws-danger)' }}>{fieldErrors[field]}</small>
      : null;
  }

  if (loading) return <div className="loading">Loading contractor...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h2>{isEdit ? 'Edit Contractor' : 'Register New Contractor / Plumber'}</h2>
        <Link to="/contractors" className="btn btn-secondary">Cancel</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input id="companyName" className="form-control" value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)} />
            <FieldError field="companyName" />
          </div>
          <div className="form-group">
            <label htmlFor="contactName">Contact Name *</label>
            <input id="contactName" className="form-control" value={form.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)} />
            <FieldError field="contactName" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Phone *</label>
            <input id="phone" className="form-control" value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)} />
            <FieldError field="phone" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" className="form-control" value={form.email}
              onChange={(e) => handleChange('email', e.target.value)} />
            <FieldError field="email" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="licenseNumber">License Number *</label>
            <input id="licenseNumber" className="form-control" value={form.licenseNumber}
              onChange={(e) => handleChange('licenseNumber', e.target.value)} />
            <FieldError field="licenseNumber" />
          </div>
          <div className="form-group">
            <label htmlFor="licenseType">License Type *</label>
            <select id="licenseType" className="form-control" value={form.licenseType}
              onChange={(e) => handleChange('licenseType', e.target.value)}>
              <option value="Contractor">Contractor</option>
              <option value="Plumber">Plumber</option>
              <option value="Both">Both</option>
            </select>
            <FieldError field="licenseType" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="authorizationDate">Authorization Date *</label>
            <input id="authorizationDate" type="date" className="form-control" value={form.authorizationDate}
              onChange={(e) => handleChange('authorizationDate', e.target.value)} />
            <FieldError field="authorizationDate" />
          </div>
          <div className="form-group">
            <label htmlFor="expirationDate">Expiration Date *</label>
            <input id="expirationDate" type="date" className="form-control" value={form.expirationDate}
              onChange={(e) => handleChange('expirationDate', e.target.value)} />
            <FieldError field="expirationDate" />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" className="form-control" value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" className="form-control" value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes about this contractor..." />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-success" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Contractor' : 'Register Contractor'}
          </button>
          <Link to="/contractors" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
