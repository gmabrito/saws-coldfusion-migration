import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const SEVERITY_BADGE = {
  Critical: 'badge badge-error',
  High:     'badge badge-warn',
  Medium:   'badge badge-unknown',
  Low:      'badge badge-ok',
};

const STATUS_BADGE = {
  active:     'badge badge-error',
  monitoring: 'badge badge-warn',
  resolved:   'badge badge-ok',
};

const STUB = {
  id: 1,
  sitrep_number: 'SITREP-2026-001',
  facility: 'North Loop Pump Station',
  type: 'Water Main Break',
  severity: 'Critical',
  status: 'active',
  location_detail: 'Main feed line at valve junction 7B',
  description:
    'Major water main break discovered at the North Loop Pump Station. Flow reduced to 40% capacity. Crews dispatched. Traffic control requested for surrounding roads.',
  created_by: 'J. Martinez',
  assigned_to: 'Operations Team Alpha',
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  notify_teams: ['Operations', 'EOC', 'Executive'],
  response_log: [
    {
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      actor: 'J. Martinez',
      action: 'SITREP created',
      note: 'Initial report filed',
    },
    {
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      actor: 'EOC Duty Officer',
      action: 'Acknowledged',
      note: 'Operations Team Alpha dispatched to site',
    },
  ],
  _stub: true,
};

const STATUSES = ['active', 'monitoring', 'resolved'];

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function SitrepDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sitrep, setSitrep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`/api/sitreps/${id}`)
      .then((res) => setSitrep(res.data))
      .catch(() => setSitrep({ ...STUB, id: parseInt(id, 10) }))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    if (!statusUpdate) return;
    setUpdating(true);
    setError(null);
    try {
      const res = await axios.patch(`/api/sitreps/${id}/status`, {
        status: statusUpdate,
        note: statusNote,
      });
      setSitrep(res.data);
      setStatusUpdate('');
      setStatusNote('');
    } catch (err) {
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="loading">Loading SITREP...</div>;
  if (!sitrep) return <div className="alert alert-danger">SITREP not found.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{sitrep.sitrep_number}</h1>
          <span style={{ color: 'var(--saws-text-muted)', fontSize: 14 }}>
            {sitrep.type} &mdash; {sitrep.facility}
          </span>
        </div>
        <Link to="/" className="btn btn-secondary">&#8592; Back to Dashboard</Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="two-col">
        {/* Left — details */}
        <div>
          <div className="card">
            <div className="card-header">Incident Details</div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Severity</span>
                <span className="detail-value">
                  <span className={SEVERITY_BADGE[sitrep.severity] || 'badge'}>{sitrep.severity}</span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <span className={STATUS_BADGE[sitrep.status] || 'badge'}>{sitrep.status}</span>
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Facility</span>
                <span className="detail-value">{sitrep.facility}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type</span>
                <span className="detail-value">{sitrep.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location Detail</span>
                <span className="detail-value">{sitrep.location_detail || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Assigned To</span>
                <span className="detail-value">{sitrep.assigned_to}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created By</span>
                <span className="detail-value">{sitrep.created_by}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created</span>
                <span className="detail-value">{fmtDate(sitrep.created_at)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated</span>
                <span className="detail-value">{fmtDate(sitrep.updated_at)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Notified Teams</span>
                <span className="detail-value">{sitrep.notify_teams?.join(', ') || '—'}</span>
              </div>
            </div>

            {sitrep.description && (
              <div style={{ marginTop: 16 }}>
                <div className="detail-label" style={{ marginBottom: 6 }}>Description</div>
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{sitrep.description}</p>
              </div>
            )}
          </div>

          {/* Status update form */}
          {sitrep.status !== 'resolved' && (
            <div className="card">
              <div className="card-header">Update Status</div>
              <form onSubmit={handleStatusUpdate}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newStatus">New Status</label>
                    <select
                      id="newStatus"
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      required
                    >
                      <option value="">— Select status —</option>
                      {STATUSES.filter((s) => s !== sitrep.status).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="statusNote">Note</label>
                  <input
                    id="statusNote"
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Optional — describe the status change"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={updating || !statusUpdate}>
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right — response log */}
        <div>
          <div className="card">
            <div className="card-header">Response Log</div>
            {sitrep.response_log?.length > 0 ? (
              <ul className="response-timeline">
                {sitrep.response_log.map((entry, i) => (
                  <li key={i}>
                    <div className="timeline-meta">
                      {fmtDate(entry.timestamp)} &mdash; {entry.actor}
                    </div>
                    <div className="timeline-action">{entry.action}</div>
                    {entry.note && <div className="timeline-note">{entry.note}</div>}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">No log entries yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
