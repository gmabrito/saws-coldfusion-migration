import { useState } from 'react';
import { requestService } from '../../services/requestService';

const DEPARTMENTS = [
  'Water Operations',
  'Wastewater Operations',
  'Engineering',
  'Customer Service',
  'Finance',
  'Human Resources',
  'Information Technology',
  'Legal',
  'Executive',
];

export default function RequestFormPage() {
  const [form, setForm] = useState({
    requester_name: '',
    requester_email: '',
    requester_phone: '',
    description: '',
    date_range_from: '',
    date_range_to: '',
    departments: [],
    preferred_format: 'electronic',
  });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.requester_name.trim()) e.requester_name = 'Name is required.';
    if (!form.requester_email.trim()) e.requester_email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requester_email))
      e.requester_email = 'Enter a valid email address.';
    if (!form.description.trim()) e.description = 'Description of records is required.';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((ev) => ({ ...ev, [name]: null }));
  }

  function handleDeptChange(e) {
    const { value, checked } = e.target;
    setForm((f) => ({
      ...f,
      departments: checked
        ? [...f.departments, value]
        : f.departments.filter((d) => d !== value),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setLoading(true);
    try {
      const result = await requestService.submitRequest({
        ...form,
        departments: form.departments.join(', '),
      });
      setSubmitted(result);
    } catch (err) {
      setErrors({ submit: 'Failed to submit request. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="public-content">
        <div className="confirmation-box">
          <div style={{ fontSize: 18, fontWeight: 600, color: '#155724' }}>
            Request Submitted Successfully
          </div>
          <div className="conf-label">Your confirmation number</div>
          <div className="conf-number">{submitted.confirmationNo}</div>
          <div style={{ fontSize: 14, color: 'var(--saws-text)', marginTop: 12 }}>
            {submitted.message}
          </div>
          {submitted.estimatedResponseDate && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--saws-text-muted)' }}>
              Estimated response by:{' '}
              <strong>{new Date(submitted.estimatedResponseDate).toLocaleDateString()}</strong>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <a href={`/public/status?ref=${submitted.confirmationNo}`} className="btn btn-secondary">
              Check Status Later
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-content">
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--saws-navy)', marginBottom: 8 }}>
        Submit a Public Records Request
      </h2>
      <p style={{ marginBottom: 24, color: 'var(--saws-text-muted)' }}>
        Under the Texas Public Information Act, SAWS must acknowledge your request within
        10 business days. All fields marked <span className="required-mark">*</span> are required.
      </p>

      {errors.submit && <div className="alert alert-danger">{errors.submit}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>
              Full Name <span className="required-mark">*</span>
            </label>
            <input
              type="text"
              name="requester_name"
              value={form.requester_name}
              onChange={handleChange}
              placeholder="Jane Smith"
            />
            {errors.requester_name && (
              <div className="form-hint" style={{ color: 'var(--saws-red)' }}>
                {errors.requester_name}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>
              Email Address <span className="required-mark">*</span>
            </label>
            <input
              type="email"
              name="requester_email"
              value={form.requester_email}
              onChange={handleChange}
              placeholder="jane@example.com"
            />
            {errors.requester_email && (
              <div className="form-hint" style={{ color: 'var(--saws-red)' }}>
                {errors.requester_email}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Phone Number (optional)</label>
          <input
            type="tel"
            name="requester_phone"
            value={form.requester_phone}
            onChange={handleChange}
            placeholder="(210) 555-0100"
            style={{ maxWidth: 240 }}
          />
        </div>

        <div className="form-group">
          <label>
            Description of Records Requested <span className="required-mark">*</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            placeholder="Please describe the records you are seeking as specifically as possible. Include document names, topics, time periods, or any other details that will help us locate the records."
          />
          {errors.description && (
            <div className="form-hint" style={{ color: 'var(--saws-red)' }}>
              {errors.description}
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date Range — From (optional)</label>
            <input
              type="date"
              name="date_range_from"
              value={form.date_range_from}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Date Range — To (optional)</label>
            <input
              type="date"
              name="date_range_to"
              value={form.date_range_to}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Departments (optional — check all that apply)</label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '6px 16px',
              marginTop: 8,
            }}
          >
            {DEPARTMENTS.map((dept) => (
              <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }}>
                <input
                  type="checkbox"
                  value={dept}
                  checked={form.departments.includes(dept)}
                  onChange={handleDeptChange}
                  style={{ width: 'auto' }}
                />
                {dept}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Preferred Format</label>
          <select
            name="preferred_format"
            value={form.preferred_format}
            onChange={handleChange}
            style={{ maxWidth: 280 }}
          >
            <option value="electronic">Electronic (PDF/email)</option>
            <option value="paper">Paper copies</option>
          </select>
        </div>

        <div style={{ marginTop: 24 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
