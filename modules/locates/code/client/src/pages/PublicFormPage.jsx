/**
 * PublicFormPage — SAWS Utility Infrastructure Locate Request
 *
 * Public-facing form. No authentication required.
 * Anyone planning to dig near SAWS water/sewer infrastructure must
 * submit this form at least 3 business days before excavation.
 *
 * On success, navigates to /confirmation with the locate_number.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WORK_TYPES = [
  'Residential',
  'Commercial',
  'Road Work',
  'Landscaping',
  'Fence Installation',
  'Other',
];

const EXCAVATION_METHODS = [
  'Hand Dig',
  'Mechanical Excavation',
  'Boring/Directional Drilling',
];

const DURATIONS = [
  '1 day',
  '2-3 days',
  '1 week',
  'more than 1 week',
];

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  company: '',
  phone: '',
  email: '',
  work_type: '',
  excavation_method: '',
  address: '',
  city: 'San Antonio',
  county: '',
  nearest_cross_street: '',
  planned_start_date: '',
  planned_duration: '',
  depth_ft: '',
  width_ft: '',
  notes: '',
  acknowledged: false,
};

/**
 * Returns the minimum allowed start date as a YYYY-MM-DD string.
 * Texas law requires 3 business days notice (skip weekends).
 */
function minStartDate() {
  const d = new Date();
  let added = 0;
  while (added < 3) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++; // skip Sat (6) and Sun (0)
  }
  return d.toISOString().split('T')[0];
}

export default function PublicFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const min = minStartDate();

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  }

  function validate() {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.email.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.work_type) errs.work_type = 'Work type is required';
    if (!form.excavation_method) errs.excavation_method = 'Excavation method is required';
    if (!form.address.trim()) errs.address = 'Street address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.planned_start_date) errs.planned_start_date = 'Planned start date is required';
    else if (form.planned_start_date < min) errs.planned_start_date = `Start date must be at least 3 business days from today (${min} or later)`;
    if (!form.planned_duration) errs.planned_duration = 'Planned duration is required';
    if (!form.acknowledged) errs.acknowledged = 'You must acknowledge the 3-business-day requirement';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerErrors([]);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      // Scroll to first error
      const first = document.querySelector('.field-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...form, acknowledged: String(form.acknowledged) };
      const { data } = await axios.post('/api/locates', payload);
      navigate('/confirmation', { state: { locate_number: data.locate_number, email: form.email } });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setServerErrors(errors.map(e => e.msg));
      } else {
        setServerErrors(['An unexpected error occurred. Please try again.']);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  function fe(field) {
    return fieldErrors[field]
      ? <span className="field-error form-hint" style={{ color: 'var(--saws-red)' }}>{fieldErrors[field]}</span>
      : null;
  }

  return (
    <div className="public-content">
      {/* Hero header */}
      <div className="locate-hero">
        <div className="locate-hero .hero-title" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--saws-blue)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          San Antonio Water System
        </div>
        <h1 className="hero-title">Utility Infrastructure Locate Request</h1>
        <p className="hero-subtitle">Required before excavation near SAWS water and sewer infrastructure</p>
      </div>

      {/* Texas law notice */}
      <div className="alert alert-info alert-law" role="alert">
        <strong>Texas Law Notice:</strong> Texas Utilities Code §251 requires you to notify SAWS at
        least <strong>3 business days</strong> before any excavation. Failure to notify may result in
        fines and liability for damage to underground infrastructure.
      </div>

      {/* Server-side errors */}
      {serverErrors.length > 0 && (
        <div className="alert alert-danger" role="alert">
          <strong>Please correct the following:</strong>
          <ul style={{ margin: '8px 0 0 16px' }}>
            {serverErrors.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Section 1: Contact Information ─────────────────────── */}
        <div className="form-section">
          <div className="form-section-title">1. Contact Information</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name <span className="required-mark">*</span></label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={form.first_name}
                onChange={handleChange}
                autoComplete="given-name"
                style={fieldErrors.first_name ? { borderColor: 'var(--saws-red)' } : {}}
              />
              {fe('first_name')}
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name <span className="required-mark">*</span></label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={form.last_name}
                onChange={handleChange}
                autoComplete="family-name"
                style={fieldErrors.last_name ? { borderColor: 'var(--saws-red)' } : {}}
              />
              {fe('last_name')}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="company">Company / Organization</label>
            <input
              id="company"
              name="company"
              type="text"
              value={form.company}
              onChange={handleChange}
              autoComplete="organization"
              placeholder="Leave blank if individual"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number <span className="required-mark">*</span></label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="210-555-0100"
                style={fieldErrors.phone ? { borderColor: 'var(--saws-red)' } : {}}
              />
              {fe('phone')}
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address <span className="required-mark">*</span></label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                style={fieldErrors.email ? { borderColor: 'var(--saws-red)' } : {}}
              />
              {fe('email')}
              <span className="form-hint">Your confirmation will be sent to this address.</span>
            </div>
          </div>
        </div>

        {/* ── Section 2: Work Details ─────────────────────────────── */}
        <div className="form-section">
          <div className="form-section-title">2. Work Details</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="work_type">Type of Work <span className="required-mark">*</span></label>
              <select
                id="work_type"
                name="work_type"
                value={form.work_type}
                onChange={handleChange}
                style={fieldErrors.work_type ? { borderColor: 'var(--saws-red)' } : {}}
              >
                <option value="">— Select —</option>
                {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {fe('work_type')}
            </div>
            <div className="form-group">
              <label htmlFor="excavation_method">Excavation Method <span className="required-mark">*</span></label>
              <select
                id="excavation_method"
                name="excavation_method"
                value={form.excavation_method}
                onChange={handleChange}
                style={fieldErrors.excavation_method ? { borderColor: 'var(--saws-red)' } : {}}
              >
                <option value="">— Select —</option>
                {EXCAVATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {fe('excavation_method')}
            </div>
          </div>
        </div>

        {/* ── Section 3: Location ─────────────────────────────────── */}
        <div className="form-section">
          <div className="form-section-title">3. Excavation Location</div>

          <div className="form-group">
            <label htmlFor="address">Street Address <span className="required-mark">*</span></label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              autoComplete="street-address"
              placeholder="123 Main Street"
              style={fieldErrors.address ? { borderColor: 'var(--saws-red)' } : {}}
            />
            {fe('address')}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City <span className="required-mark">*</span></label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                style={fieldErrors.city ? { borderColor: 'var(--saws-red)' } : {}}
              />
              {fe('city')}
            </div>
            <div className="form-group">
              <label htmlFor="county">County</label>
              <input
                id="county"
                name="county"
                type="text"
                value={form.county}
                onChange={handleChange}
                placeholder="Bexar"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nearest_cross_street">Nearest Cross Street</label>
            <input
              id="nearest_cross_street"
              name="nearest_cross_street"
              type="text"
              value={form.nearest_cross_street}
              onChange={handleChange}
              placeholder="e.g., Huebner Rd & Vance Jackson Rd"
            />
            <span className="form-hint">Helps our field crew locate the site faster.</span>
          </div>
        </div>

        {/* ── Section 4: Dig Details ──────────────────────────────── */}
        <div className="form-section">
          <div className="form-section-title">4. Excavation Details</div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="planned_start_date">
                Planned Start Date <span className="required-mark">*</span>
              </label>
              <input
                id="planned_start_date"
                name="planned_start_date"
                type="date"
                value={form.planned_start_date}
                min={min}
                onChange={handleChange}
                style={fieldErrors.planned_start_date ? { borderColor: 'var(--saws-red)' } : {}}
              />
              {fe('planned_start_date')}
              <span className="form-hint">Must be at least 3 business days from today. Earliest: {min}</span>
            </div>
            <div className="form-group">
              <label htmlFor="planned_duration">Planned Duration <span className="required-mark">*</span></label>
              <select
                id="planned_duration"
                name="planned_duration"
                value={form.planned_duration}
                onChange={handleChange}
                style={fieldErrors.planned_duration ? { borderColor: 'var(--saws-red)' } : {}}
              >
                <option value="">— Select —</option>
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {fe('planned_duration')}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="depth_ft">Depth (feet)</label>
              <input
                id="depth_ft"
                name="depth_ft"
                type="number"
                min="0"
                step="0.5"
                value={form.depth_ft}
                onChange={handleChange}
                placeholder="e.g., 4"
              />
            </div>
            <div className="form-group">
              <label htmlFor="width_ft">Width (feet)</label>
              <input
                id="width_ft"
                name="width_ft"
                type="number"
                min="0"
                step="0.5"
                value={form.width_ft}
                onChange={handleChange}
                placeholder="e.g., 2"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={form.notes}
              onChange={handleChange}
              placeholder="Describe the work, any special conditions, or specific infrastructure concerns…"
            />
            <span className="form-hint">Optional — any extra detail that helps our crew prepare.</span>
          </div>
        </div>

        {/* ── Acknowledgment ───────────────────────────────────────── */}
        <div className="ack-block" style={fieldErrors.acknowledged ? { borderColor: 'var(--saws-red)' } : {}}>
          <input
            id="acknowledged"
            name="acknowledged"
            type="checkbox"
            checked={form.acknowledged}
            onChange={handleChange}
          />
          <label htmlFor="acknowledged">
            I acknowledge that Texas state law requires locate requests to be submitted at least
            <strong> 3 business days</strong> before excavation, and that I am responsible for
            verifying all utility locations before digging.
          </label>
        </div>
        {fe('acknowledged')}

        <button
          type="submit"
          className="btn-submit-locate"
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Submit Locate Request'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
          After submission you will receive a confirmation with your ticket number.
          A SAWS representative will respond within 1–3 business days.
        </p>
      </form>
    </div>
  );
}
