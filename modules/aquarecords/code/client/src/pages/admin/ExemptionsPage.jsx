import { useState, useEffect } from 'react';
import { requestService } from '../../services/requestService';

const EMPTY_FORM = { code: '', statutory_basis: '', description: '', is_active: true };

export default function ExemptionsPage() {
  const [exemptions, setExemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null); // null = not editing
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    requestService.getExemptions()
      .then((data) => setExemptions(data.exemptions || []))
      .catch(() => setError('Failed to load exemptions.'))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      const saved = await requestService.upsertExemption(form);
      // Refresh list
      const data = await requestService.getExemptions();
      setExemptions(data.exemptions || []);
      setForm(null);
      setSaveMsg({ type: 'success', text: 'Exemption saved.' });
    } catch {
      setSaveMsg({ type: 'danger', text: 'Failed to save exemption.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading exemptions...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Exemption Categories</h1>
        <button
          className="btn btn-primary"
          onClick={() => setForm({ ...EMPTY_FORM })}
          disabled={!!form}
        >
          + Add Exemption
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {saveMsg && <div className={`alert alert-${saveMsg.type}`}>{saveMsg.text}</div>}

      {form && (
        <div className="card">
          <div className="card-header">{form.id ? 'Edit Exemption' : 'New Exemption'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Code (e.g. 552.101)</label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="552.XXX"
                  required
                />
              </div>
              <div className="form-group">
                <label>Statutory Basis</label>
                <input
                  name="statutory_basis"
                  value={form.statutory_basis}
                  onChange={handleChange}
                  placeholder="Tex. Gov't Code §552.XXX"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400 }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  style={{ width: 'auto' }}
                />
                Active
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Statutory Basis</th>
            <th>Description</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {exemptions.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: 'var(--saws-text-muted)' }}>
                No exemptions configured.
              </td>
            </tr>
          ) : (
            exemptions.map((ex) => (
              <tr key={ex.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ex.code}</td>
                <td>{ex.statutory_basis}</td>
                <td style={{ maxWidth: 400 }}>{ex.description}</td>
                <td>{ex.is_active ? 'Yes' : 'No'}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setForm({ ...ex })}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
