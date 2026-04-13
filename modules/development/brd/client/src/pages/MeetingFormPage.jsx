import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { meetingService } from '../services/api';

const INITIAL_FORM = {
  title: '',
  meetingDate: '',
  location: '',
  status: 'Scheduled',
};

export default function MeetingFormPage() {
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
      meetingService.get(id)
        .then((res) => {
          const m = res.data;
          setForm({
            title: m.Title || '',
            meetingDate: m.MeetingDate ? m.MeetingDate.substring(0, 10) : '',
            location: m.Location || '',
            status: m.Status || 'Scheduled',
          });
        })
        .catch(() => setError('Failed to load meeting'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.meetingDate) errs.meetingDate = 'Date is required';
    if (!form.location.trim()) errs.location = 'Location is required';
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
        await meetingService.update(id, form);
      } else {
        await meetingService.create(form);
      }
      navigate('/meetings');
    } catch (err) {
      if (err.response?.data?.errors) {
        const mapped = {};
        err.response.data.errors.forEach((e) => { mapped[e.path] = e.msg; });
        setFieldErrors(mapped);
      } else {
        setError(err.response?.data?.error || 'Failed to save meeting');
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

  if (loading) return <div className="loading">Loading meeting...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h2>{isEdit ? 'Edit Meeting' : 'New CIAC Meeting'}</h2>
        <Link to="/meetings" className="btn btn-secondary">Cancel</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Meeting Title *</label>
          <input
            id="title"
            className="form-control"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          {fieldErrors.title && <small style={{ color: 'var(--saws-danger)' }}>{fieldErrors.title}</small>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="meetingDate">Meeting Date *</label>
            <input
              id="meetingDate"
              type="date"
              className="form-control"
              value={form.meetingDate}
              onChange={(e) => handleChange('meetingDate', e.target.value)}
            />
            {fieldErrors.meetingDate && <small style={{ color: 'var(--saws-danger)' }}>{fieldErrors.meetingDate}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              className="form-control"
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location *</label>
          <input
            id="location"
            className="form-control"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
          {fieldErrors.location && <small style={{ color: 'var(--saws-danger)' }}>{fieldErrors.location}</small>}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-success" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Meeting' : 'Create Meeting'}
          </button>
          <Link to="/meetings" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
