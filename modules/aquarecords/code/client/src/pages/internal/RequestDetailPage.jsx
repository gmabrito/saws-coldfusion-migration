import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import StatusBadge from '../../components/StatusBadge';

const VALID_STATUSES = ['acknowledged', 'in_review', 'pending_response', 'completed', 'denied', 'partial'];

export default function RequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    requestService.getRequest(id)
      .then((data) => { setRequest(data); setNewStatus(data.status); })
      .catch(() => setError('Failed to load request.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await requestService.updateStatus(id, newStatus, statusNote);
      setRequest((r) => ({ ...r, status: newStatus }));
      setStatusNote('');
      setSaveMsg({ type: 'success', text: 'Status updated.' });
    } catch {
      setSaveMsg({ type: 'danger', text: 'Failed to update status.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      await requestService.addNote(id, noteText);
      setNoteText('');
      // Refresh to show new note
      const updated = await requestService.getRequest(id);
      setRequest(updated);
      setSaveMsg({ type: 'success', text: 'Note added.' });
    } catch {
      setSaveMsg({ type: 'danger', text: 'Failed to add note.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading request...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!request) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontFamily: 'monospace' }}>{request.confirmation_no}</h1>
          <div style={{ marginTop: 4 }}><StatusBadge status={request.status} /></div>
        </div>
        <a href="/internal/queue" className="btn btn-secondary">
          &larr; Back to Queue
        </a>
      </div>

      {saveMsg && (
        <div className={`alert alert-${saveMsg.type}`}>{saveMsg.text}</div>
      )}

      {/* Request Info */}
      <div className="card">
        <div className="card-header">Request Information</div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Requester</span>
            <span className="detail-value">{request.requester_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">
              <a href={`mailto:${request.requester_email}`}>{request.requester_email}</a>
            </span>
          </div>
          {request.requester_phone && (
            <div className="detail-item">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{request.requester_phone}</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Submitted</span>
            <span className="detail-value">
              {new Date(request.submitted_at).toLocaleString()}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Due Date</span>
            <span className="detail-value">
              {new Date(request.due_date).toLocaleDateString()}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Preferred Format</span>
            <span className="detail-value">{request.preferred_format}</span>
          </div>
          {request.departments && (
            <div className="detail-item">
              <span className="detail-label">Departments</span>
              <span className="detail-value">{request.departments}</span>
            </div>
          )}
          {request.assigned_to && (
            <div className="detail-item">
              <span className="detail-label">Assigned To</span>
              <span className="detail-value">{request.assigned_to}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="detail-label" style={{ marginBottom: 8 }}>Description</div>
          <div
            style={{
              background: 'var(--saws-light)',
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {request.description}
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Actions */}
        <div>
          <div className="card">
            <div className="card-header">Update Status</div>
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label>New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {VALID_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Note (optional)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note about this status change..."
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                Update Status
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-header">Add Internal Note</div>
            <form onSubmit={handleAddNote}>
              <div className="form-group">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  placeholder="Internal note — not visible to the requester..."
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary"
                disabled={saving || !noteText.trim()}
              >
                Add Note
              </button>
            </form>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="card">
            <div className="card-header">Status Timeline</div>
            {request.timeline && request.timeline.length > 0 ? (
              <ul className="timeline">
                {request.timeline.map((entry) => (
                  <li key={entry.id} className="timeline-item">
                    <div className="timeline-date">
                      {new Date(entry.created_at).toLocaleString()}
                    </div>
                    <div className="timeline-content">
                      {entry.from_status ? (
                        <span>
                          <StatusBadge status={entry.from_status} /> &rarr;{' '}
                          <StatusBadge status={entry.to_status} />
                        </span>
                      ) : (
                        <StatusBadge status={entry.to_status} />
                      )}
                      {entry.note && (
                        <div style={{ marginTop: 4, color: 'var(--saws-text-muted)', fontSize: 13 }}>
                          {entry.note}
                        </div>
                      )}
                    </div>
                    <div className="timeline-author">{entry.changed_by}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">No timeline entries yet.</div>
            )}
          </div>

          {request.notes && request.notes.length > 0 && (
            <div className="card">
              <div className="card-header">Internal Notes ({request.notes.length})</div>
              {request.notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid var(--saws-border)',
                    fontSize: 13,
                  }}
                >
                  <div style={{ color: 'var(--saws-text)' }}>{note.note_text}</div>
                  <div style={{ color: 'var(--saws-text-muted)', marginTop: 4 }}>
                    {note.author} &mdash; {new Date(note.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
