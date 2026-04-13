import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { agendaService } from '../services/api';

export default function AgendaFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    agendaType: searchParams.get('type') || 'Board',
    committeeType: '',
    meetingDate: '',
    title: '',
    description: '',
    accessibilityNotes: '',
    location: '',
    status: 'Draft'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadAgenda();
    }
  }, [id]);

  async function loadAgenda() {
    setLoading(true);
    try {
      const data = await agendaService.getById(id);
      setForm({
        agendaType: data.AgendaType,
        committeeType: data.CommitteeType || '',
        meetingDate: data.MeetingDate ? new Date(data.MeetingDate).toISOString().slice(0, 16) : '',
        title: data.Title,
        description: data.Description || '',
        accessibilityNotes: data.AccessibilityNotes || '',
        location: data.Location || '',
        status: data.Status
      });
    } catch (err) {
      setError('Failed to load agenda');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      // Clear committeeType when switching to Board
      ...(name === 'agendaType' && value === 'Board' ? { committeeType: '' } : {})
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.meetingDate) {
      setError('Meeting date is required');
      return;
    }
    if (form.agendaType === 'Committee' && !form.committeeType) {
      setError('Committee type is required for committee agendas');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        committeeType: form.agendaType === 'Committee' ? form.committeeType : null
      };

      if (isEdit) {
        await agendaService.update(id, payload);
        setSuccess('Agenda updated successfully');
        setTimeout(() => navigate(`/agendas/${id}`), 1000);
      } else {
        const result = await agendaService.create(payload);
        setSuccess('Agenda created successfully');
        setTimeout(() => navigate(`/agendas/${result.agendaId}`), 1000);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save agenda';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading agenda...</div>;

  return (
    <div className="page">
      <Link
        to={form.agendaType === 'Committee' ? '/committee-agendas' : '/board-agendas'}
        className="back-link"
      >
        &larr; Back to {form.agendaType === 'Committee' ? 'Committee' : 'Board'} Agendas
      </Link>

      <h2>{isEdit ? 'Edit Agenda' : 'Create New Agenda'}</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Agenda Type *</label>
            <select name="agendaType" value={form.agendaType} onChange={handleChange}>
              <option value="Board">Board</option>
              <option value="Committee">Committee</option>
            </select>
          </div>

          {form.agendaType === 'Committee' && (
            <div className="form-group">
              <label>Committee Type *</label>
              <select name="committeeType" value={form.committeeType} onChange={handleChange} required>
                <option value="">Select Committee</option>
                <option value="Audit">Audit Committee</option>
                <option value="Compensation">Compensation Committee</option>
              </select>
            </div>
          )}

          {form.agendaType === 'Board' && (
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="Draft">Draft</option>
                <option value="Published">Published</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Enter agenda title"
            maxLength={255}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Meeting Date &amp; Time *</label>
            <input
              type="datetime-local"
              name="meetingDate"
              value={form.meetingDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. SAWS Board Room, 2800 US Hwy 281 N"
              maxLength={255}
            />
          </div>
        </div>

        {form.agendaType === 'Committee' && (
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the agenda items and topics to be covered"
            rows={4}
          />
        </div>

        {/* BRD 7.2: Handicap accessibility information */}
        <div className="form-group">
          <label>Accessibility Notes</label>
          <textarea
            name="accessibilityNotes"
            value={form.accessibilityNotes}
            onChange={handleChange}
            placeholder="Describe handicap accessibility features (e.g. wheelchair access, hearing loop, sign language interpreter)"
            rows={3}
          />
        </div>

        <div className="btn-group">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Agenda' : 'Create Agenda'}
          </button>
          <Link
            to={form.agendaType === 'Committee' ? '/committee-agendas' : '/board-agendas'}
            className="btn btn-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
