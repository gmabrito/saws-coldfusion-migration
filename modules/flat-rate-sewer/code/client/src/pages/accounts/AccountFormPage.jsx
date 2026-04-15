import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountService } from '../../services/api';

const METER_SIZES = ['1"', '1.5"', '2"', '3"', '4"', '6"', '8"', '10"', '12"'];
const METHODS = ['METERED', 'FLAT', 'ESTIMATED'];
const BILLING_BASES = ['CONSUMPTION', 'MINIMUM', 'COMBINED'];

export default function AccountFormPage() {
  const { accountNum } = useParams();
  const navigate = useNavigate();
  const isEdit = !!accountNum;

  const [form, setForm] = useState({
    account_num: '',
    facility_description: '',
    meter_size: '2"',
    method: 'METERED',
    billing_basis: 'CONSUMPTION',
    bod_percent: 0,
    tdd_percent: 0,
    assessment_frequency_months: 12,
    inspection_frequency_months: 24,
    business_name: '',
    contact_name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      loadAccount();
    }
  }, [accountNum]);

  async function loadAccount() {
    try {
      const res = await accountService.getById(accountNum);
      setForm(res.data);
    } catch {
      setForm((prev) => ({
        ...prev,
        account_num: accountNum,
        facility_description: 'Commercial Facility',
        business_name: 'Sample Business',
      }));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.account_num) {
      setError('Account number is required');
      return;
    }
    if (!form.business_name) {
      setError('Business name is required');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await accountService.update(accountNum, form);
      } else {
        await accountService.create(form);
      }
      navigate(`/accounts/${form.account_num}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading account...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Account' : 'New Account'}</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">Account Details</div>
          <div className="form-row">
            <div className="form-group">
              <label>Account Number</label>
              <input
                name="account_num"
                value={form.account_num}
                onChange={handleChange}
                disabled={isEdit}
                required
                pattern="[0-9]+"
                placeholder="e.g. 100234"
              />
              <div className="form-hint">Numeric only. Cannot be changed after creation.</div>
            </div>
            <div className="form-group">
              <label>Facility Description</label>
              <input
                name="facility_description"
                value={form.facility_description}
                onChange={handleChange}
                placeholder="e.g. Commercial Car Wash"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Meter Size</label>
              <select name="meter_size" value={form.meter_size} onChange={handleChange}>
                {METER_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Method</label>
              <select name="method" value={form.method} onChange={handleChange}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Billing Basis</label>
              <select name="billing_basis" value={form.billing_basis} onChange={handleChange}>
                {BILLING_BASES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>BOD %</label>
              <input name="bod_percent" type="number" step="0.01" min="0" max="100" value={form.bod_percent} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>TDD %</label>
              <input name="tdd_percent" type="number" step="0.01" min="0" max="100" value={form.tdd_percent} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Assessment Frequency (months)</label>
              <input name="assessment_frequency_months" type="number" min="1" max="60" value={form.assessment_frequency_months} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Inspection Frequency (months)</label>
              <input name="inspection_frequency_months" type="number" min="1" max="60" value={form.inspection_frequency_months} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Contact Information</div>
          <div className="form-row">
            <div className="form-group">
              <label>Business Name</label>
              <input name="business_name" value={form.business_name} onChange={handleChange} required placeholder="Business name" />
            </div>
            <div className="form-group">
              <label>Contact Name</label>
              <input name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="Primary contact" />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Full address" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="(210) 555-0100" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="contact@business.com" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
