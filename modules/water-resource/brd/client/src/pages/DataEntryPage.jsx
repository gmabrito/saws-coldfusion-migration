import { useState } from 'react';
import { statsService } from '../services/api';

// BRD 7.1: Admin form to enter daily data (manual data entry)
// Fields: date, county water levels (5), precipitation, temperature high/low, total pumpage
const INITIAL_FORM = {
  readingDate: new Date().toISOString().split('T')[0],
  bexarLevel: '',
  medinaLevel: '',
  uvaldeLevel: '',
  comalLevel: '',
  haysLevel: '',
  precipitation: '',
  temperatureHigh: '',
  temperatureLow: '',
  totalPumpage: ''
};

export default function DataEntryPage() {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [apiError, setApiError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function validate() {
    const newErrors = {};

    if (!form.readingDate) {
      newErrors.readingDate = 'Reading date is required.';
    }

    const numericFields = [
      { key: 'bexarLevel', label: 'Bexar County level', min: 0 },
      { key: 'medinaLevel', label: 'Medina County level', min: 0 },
      { key: 'uvaldeLevel', label: 'Uvalde County level', min: 0 },
      { key: 'comalLevel', label: 'Comal County level', min: 0 },
      { key: 'haysLevel', label: 'Hays County level', min: 0 },
      { key: 'precipitation', label: 'Precipitation', min: 0 },
      { key: 'temperatureHigh', label: 'Temperature high' },
      { key: 'temperatureLow', label: 'Temperature low' },
      { key: 'totalPumpage', label: 'Total pumpage', min: 0 }
    ];

    for (const field of numericFields) {
      const val = form[field.key];
      if (val === '' || val === null || val === undefined) {
        newErrors[field.key] = `${field.label} is required.`;
      } else if (isNaN(Number(val))) {
        newErrors[field.key] = `${field.label} must be a number.`;
      } else if (field.min !== undefined && Number(val) < field.min) {
        newErrors[field.key] = `${field.label} must be ${field.min} or greater.`;
      }
    }

    // Temperature high should be >= temperature low
    if (!newErrors.temperatureHigh && !newErrors.temperatureLow) {
      if (Number(form.temperatureHigh) < Number(form.temperatureLow)) {
        newErrors.temperatureHigh = 'High temperature must be greater than or equal to low temperature.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccess(null);
    setApiError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      await statsService.addDailyReading({
        readingDate: form.readingDate,
        bexarLevel: Number(form.bexarLevel),
        medinaLevel: Number(form.medinaLevel),
        uvaldeLevel: Number(form.uvaldeLevel),
        comalLevel: Number(form.comalLevel),
        haysLevel: Number(form.haysLevel),
        precipitation: Number(form.precipitation),
        temperatureHigh: Number(form.temperatureHigh),
        temperatureLow: Number(form.temperatureLow),
        totalPumpage: Number(form.totalPumpage)
      });
      setSuccess(`Daily reading for ${form.readingDate} saved successfully.`);
      setForm({ ...INITIAL_FORM });
    } catch (err) {
      const message = err.response?.data?.error
        || err.response?.data?.errors?.map(e => e.msg).join(', ')
        || 'Failed to save daily reading.';
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm({ ...INITIAL_FORM });
    setErrors({});
    setSuccess(null);
    setApiError(null);
  }

  return (
    <div>
      <div className="section-header">
        <h2>Daily Data Entry</h2>
        <span className="section-subtitle">Manually enter aquifer readings and weather data</span>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {apiError && <div className="alert alert-error">{apiError}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Reading Date */}
          <div className="form-group">
            <label htmlFor="readingDate">Reading Date *</label>
            <input
              id="readingDate"
              type="date"
              name="readingDate"
              value={form.readingDate}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              style={{ maxWidth: '220px' }}
            />
            {errors.readingDate && <div className="error-text">{errors.readingDate}</div>}
          </div>

          {/* County Water Levels */}
          <div className="card-header" style={{ marginTop: '8px' }}>
            <h2>County Water Levels (ft MSL)</h2>
          </div>
          <div className="form-row-5">
            <div className="form-group">
              <label htmlFor="bexarLevel">Bexar County *</label>
              <input
                id="bexarLevel"
                type="number"
                name="bexarLevel"
                value={form.bexarLevel}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="e.g. 668.2"
              />
              {errors.bexarLevel && <div className="error-text">{errors.bexarLevel}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="medinaLevel">Medina County *</label>
              <input
                id="medinaLevel"
                type="number"
                name="medinaLevel"
                value={form.medinaLevel}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="e.g. 634.5"
              />
              {errors.medinaLevel && <div className="error-text">{errors.medinaLevel}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="uvaldeLevel">Uvalde County *</label>
              <input
                id="uvaldeLevel"
                type="number"
                name="uvaldeLevel"
                value={form.uvaldeLevel}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="e.g. 873.1"
              />
              {errors.uvaldeLevel && <div className="error-text">{errors.uvaldeLevel}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="comalLevel">Comal County *</label>
              <input
                id="comalLevel"
                type="number"
                name="comalLevel"
                value={form.comalLevel}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="e.g. 550.3"
              />
              {errors.comalLevel && <div className="error-text">{errors.comalLevel}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="haysLevel">Hays County *</label>
              <input
                id="haysLevel"
                type="number"
                name="haysLevel"
                value={form.haysLevel}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="e.g. 414.8"
              />
              {errors.haysLevel && <div className="error-text">{errors.haysLevel}</div>}
            </div>
          </div>

          {/* Weather Data */}
          <div className="card-header" style={{ marginTop: '8px' }}>
            <h2>Weather &amp; Pumpage Data</h2>
          </div>
          <div className="form-row-3">
            <div className="form-group">
              <label htmlFor="precipitation">Daily Precipitation (inches) *</label>
              <input
                id="precipitation"
                type="number"
                name="precipitation"
                value={form.precipitation}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="e.g. 0.05"
              />
              {errors.precipitation && <div className="error-text">{errors.precipitation}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="temperatureHigh">Temperature High (&deg;F) *</label>
              <input
                id="temperatureHigh"
                type="number"
                name="temperatureHigh"
                value={form.temperatureHigh}
                onChange={handleChange}
                step="0.1"
                placeholder="e.g. 91"
              />
              {errors.temperatureHigh && <div className="error-text">{errors.temperatureHigh}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="temperatureLow">Temperature Low (&deg;F) *</label>
              <input
                id="temperatureLow"
                type="number"
                name="temperatureLow"
                value={form.temperatureLow}
                onChange={handleChange}
                step="0.1"
                placeholder="e.g. 70"
              />
              {errors.temperatureLow && <div className="error-text">{errors.temperatureLow}</div>}
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: '380px' }}>
            <label htmlFor="totalPumpage">Total Pumpage (acre-feet) *</label>
            <input
              id="totalPumpage"
              type="number"
              name="totalPumpage"
              value={form.totalPumpage}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="e.g. 10892.30"
            />
            {errors.totalPumpage && <div className="error-text">{errors.totalPumpage}</div>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Daily Reading'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={submitting}>
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
