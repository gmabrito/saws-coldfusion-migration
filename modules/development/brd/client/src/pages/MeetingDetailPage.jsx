import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { meetingService } from '../services/api';

export default function MeetingDetailPage() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Minutes editing state
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [minutesDraft, setMinutesDraft] = useState('');
  const [savingMinutes, setSavingMinutes] = useState(false);
  const [minutesSuccess, setMinutesSuccess] = useState('');

  // Document upload state
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ fileName: '', fileType: '', description: '' });
  const [savingDoc, setSavingDoc] = useState(false);

  useEffect(() => {
    loadMeeting();
  }, [id]);

  async function loadMeeting() {
    setLoading(true);
    try {
      const res = await meetingService.get(id);
      setMeeting(res.data);
      setMinutesDraft(res.data.Minutes || '');
    } catch (err) {
      setError('Failed to load meeting');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMinutes() {
    setSavingMinutes(true);
    setMinutesSuccess('');
    try {
      await meetingService.updateMinutes(id, minutesDraft);
      setMeeting((prev) => ({ ...prev, Minutes: minutesDraft }));
      setEditingMinutes(false);
      setMinutesSuccess('Minutes saved successfully');
      setTimeout(() => setMinutesSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save minutes');
    } finally {
      setSavingMinutes(false);
    }
  }

  async function handleAddDocument(e) {
    e.preventDefault();
    setSavingDoc(true);
    try {
      await meetingService.addDocument(id, docForm);
      setShowDocForm(false);
      setDocForm({ fileName: '', fileType: '', description: '' });
      await loadMeeting();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add document');
    } finally {
      setSavingDoc(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function statusBadge(status) {
    const cls = {
      Scheduled: 'badge-scheduled',
      'In Progress': 'badge-in-progress',
      Completed: 'badge-completed',
      Cancelled: 'badge-cancelled',
    }[status] || '';
    return <span className={`badge ${cls}`}>{status}</span>;
  }

  if (loading) return <div className="loading">Loading meeting details...</div>;
  if (error && !meeting) return <div className="alert alert-error">{error}</div>;
  if (!meeting) return <div className="alert alert-error">Meeting not found</div>;

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {minutesSuccess && <div className="alert alert-success">{minutesSuccess}</div>}

      {/* Meeting Details */}
      <div className="card">
        <div className="card-header">
          <h2>{meeting.Title}</h2>
          <div className="actions-row">
            <Link to={`/meetings/${id}/edit`} className="btn btn-primary">Edit Meeting</Link>
            <Link to="/meetings" className="btn btn-secondary">Back to List</Link>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="label">Date</div>
            <div className="value">{formatDate(meeting.MeetingDate)}</div>
          </div>
          <div className="detail-item">
            <div className="label">Location</div>
            <div className="value">{meeting.Location}</div>
          </div>
          <div className="detail-item">
            <div className="label">Status</div>
            <div className="value">{statusBadge(meeting.Status)}</div>
          </div>
          <div className="detail-item">
            <div className="label">Last Modified</div>
            <div className="value">{formatDateTime(meeting.ModifiedDate)}</div>
          </div>
        </div>
      </div>

      {/* Meeting Minutes - BRD 7.1 */}
      <div className="card">
        <div className="card-header">
          <h2>Meeting Minutes</h2>
          {!editingMinutes && (
            <button className="btn btn-primary" onClick={() => setEditingMinutes(true)}>
              {meeting.Minutes ? 'Edit Minutes' : 'Add Minutes'}
            </button>
          )}
        </div>

        {editingMinutes ? (
          <div>
            <textarea
              className="form-control"
              value={minutesDraft}
              onChange={(e) => setMinutesDraft(e.target.value)}
              placeholder="Enter meeting minutes here..."
              rows={12}
            />
            <div className="form-actions">
              <button className="btn btn-success" onClick={handleSaveMinutes} disabled={savingMinutes}>
                {savingMinutes ? 'Saving...' : 'Save Minutes'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setEditingMinutes(false); setMinutesDraft(meeting.Minutes || ''); }}>
                Cancel
              </button>
            </div>
          </div>
        ) : meeting.Minutes ? (
          <div className="minutes-content">{meeting.Minutes}</div>
        ) : (
          <div className="empty-state">No minutes recorded yet.</div>
        )}
      </div>

      {/* Meeting Documents - BRD 7.1 */}
      <div className="card">
        <div className="card-header">
          <h2>Meeting Documents</h2>
          <button className="btn btn-primary" onClick={() => setShowDocForm(!showDocForm)}>
            {showDocForm ? 'Cancel' : '+ Add Document'}
          </button>
        </div>

        {showDocForm && (
          <form onSubmit={handleAddDocument} style={{ marginBottom: 16, padding: 16, background: 'var(--saws-light-gray)', borderRadius: 4 }}>
            <div className="form-row">
              <div className="form-group">
                <label>File Name *</label>
                <input
                  className="form-control"
                  value={docForm.fileName}
                  onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>File Type *</label>
                <select
                  className="form-control"
                  value={docForm.fileType}
                  onChange={(e) => setDocForm({ ...docForm, fileType: e.target.value })}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="PDF">PDF</option>
                  <option value="Word">Word Document</option>
                  <option value="Excel">Excel Spreadsheet</option>
                  <option value="PowerPoint">PowerPoint</option>
                  <option value="Image">Image</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                className="form-control"
                value={docForm.description}
                onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-success" disabled={savingDoc}>
              {savingDoc ? 'Adding...' : 'Add Document'}
            </button>
          </form>
        )}

        {meeting.documents && meeting.documents.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {meeting.documents.map((doc) => (
                <tr key={doc.DocumentID}>
                  <td>{doc.FileName}</td>
                  <td>{doc.FileType}</td>
                  <td>{doc.Description || '--'}</td>
                  <td>{formatDateTime(doc.UploadDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No documents uploaded.</div>
        )}
      </div>
    </div>
  );
}
