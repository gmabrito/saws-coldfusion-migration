import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FACILITIES = [
  'Pump Station',
  'Treatment Plant',
  'Main Office',
  'Substation',
];

const INCIDENT_TYPES = [
  'Water Main Break',
  'Power Outage',
  'Security Incident',
  'Chemical Spill',
  'Equipment Failure',
  'Other',
];

const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

const TEAMS = ['Operations', 'EOC', 'IT', 'Executive'];

export default function NewSitrepPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    facility: '',
    type: '',
    severity: 'Medium',
    location_detail: '',
    description: '',
    notify_teams: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTeamToggle(team) {
    setForm((prev) => ({
      ...prev,
      notify_teams: prev.notify_teams.includes(team)
        ? prev.notify_teams.filter((t) => t !== team)
        : [...prev.notify_teams, team],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.facility || !form.type || !form.description.trim()) {
      setError('Facility, incident type, and description are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post('/api/sitreps', form);
      navigate(`/sitrep/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit SITREP. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>New SITREP</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="facility">Facility *</label>
              <select id="facility" name="facility" value={form.facility} onChange={handleChange} required>
                <option value="">— Select facility —</option>
                {FACILITIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type">Incident Type *</label>
              <select id="type" name="type" value={form.type} onChange={handleChange} required>
                <option value="">— Select type —</option>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="severity">Severity *</label>
              <select id="severity" name="severity" value={form.severity} onChange={handleChange} required>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location_detail">Location Detail</label>
            <input
              id="location_detail"
              name="location_detail"
              type="text"
              value={form.location_detail}
              onChange={handleChange}
              placeholder="e.g. Main feed line at valve junction 7B"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the incident, current conditions, and any immediate actions taken..."
              required
            />
          </div>

          <div className="form-group">
            <label>Notify Teams</label>
            <div className="notify-teams-grid">
              {TEAMS.map((team) => (
                <label key={team}>
                  <input
                    type="checkbox"
                    checked={form.notify_teams.includes(team)}
                    onChange={() => handleTeamToggle(team)}
                  />
                  {team}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit SITREP'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
