import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { solicitationService } from '../services/api';

const TYPE_OPTIONS = [
  'Invitation for Bid',
  'Request for Proposal',
  'Request for Qualification',
];

const STATUS_OPTIONS = ['Open', 'Closed', 'Awarded'];

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

export default function SolicitationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    solicitationType: TYPE_OPTIONS[0],
    deadline: '',
    status: 'Open',
    awardedVendorId: '',
    awardDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setFetchLoading(true);
      try {
        const res = await solicitationService.get(id);
        const s = res.data;
        setForm({
          title: s.Title || '',
          description: s.Description || '',
          solicitationType: s.SolicitationType || TYPE_OPTIONS[0],
          deadline: toDateInputValue(s.Deadline),
          status: s.Status || 'Open',
          awardedVendorId: s.AwardedVendorID || '',
          awardDate: toDateInputValue(s.AwardDate),
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load solicitation');
      } finally {
        setFetchLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!form.title.trim()) {
      setError('Title is required');
      setLoading(false);
      return;
    }
    if (!form.solicitationType) {
      setError('Solicitation type is required');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        solicitationType: form.solicitationType,
        deadline: form.deadline || null,
        status: form.status,
        awardedVendorId: form.awardedVendorId ? parseInt(form.awardedVendorId, 10) : null,
        awardDate: form.awardDate || null,
      };

      if (isEdit) {
        await solicitationService.update(id, payload);
      } else {
        await solicitationService.create(payload);
      }
      navigate('/solicitations');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        setError(errData.errors.map((e) => e.msg).join(', '));
      } else {
        setError(errData?.error || 'Failed to save solicitation');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="loading">Loading solicitation...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h2>{isEdit ? 'Edit Solicitation' : 'New Solicitation'}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            name="title"
            type="text"
            className="form-control"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter solicitation title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            value={form.description}
            onChange={handleChange}
            placeholder="Detailed description of the solicitation"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="solicitationType">Solicitation Type *</label>
            <select
              id="solicitationType"
              name="solicitationType"
              className="form-control"
              value={form.solicitationType}
              onChange={handleChange}
              required
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              className="form-control"
              value={form.status}
              onChange={handleChange}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="deadline">Deadline</label>
            <input
              id="deadline"
              name="deadline"
              type="date"
              className="form-control"
              value={form.deadline}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            {/* Spacer for grid alignment */}
          </div>
        </div>

        {form.status === 'Awarded' && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="awardedVendorId">Awarded Vendor ID</label>
              <input
                id="awardedVendorId"
                name="awardedVendorId"
                type="number"
                className="form-control"
                value={form.awardedVendorId}
                onChange={handleChange}
                placeholder="Vendor ID"
              />
            </div>
            <div className="form-group">
              <label htmlFor="awardDate">Award Date</label>
              <input
                id="awardDate"
                name="awardDate"
                type="date"
                className="form-control"
                value={form.awardDate}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Update Solicitation' : 'Create Solicitation')}
          </button>
          <Link to="/solicitations" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
