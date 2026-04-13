import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { solicitationService } from '../services/api';

function formatDate(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const cls = `badge badge-${status.toLowerCase()}`;
  return <span className={cls}>{status}</span>;
}

export default function SolicitationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [solicitation, setSolicitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Document form state
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ fileName: '', fileType: '', description: '' });
  const [docLoading, setDocLoading] = useState(false);
  const [docMessage, setDocMessage] = useState('');

  // Notification form state
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ message: '', recipientCount: '' });
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await solicitationService.get(id);
      setSolicitation(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load solicitation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this solicitation? This action cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await solicitationService.delete(id);
      navigate('/solicitations');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete solicitation');
      setDeleteLoading(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    setDocLoading(true);
    setDocMessage('');
    try {
      await solicitationService.addDocument(id, docForm);
      setDocForm({ fileName: '', fileType: '', description: '' });
      setShowDocForm(false);
      setDocMessage('Document added successfully');
      await fetchDetail();
    } catch (err) {
      setDocMessage(err.response?.data?.error || 'Failed to add document');
    } finally {
      setDocLoading(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setNotifyLoading(true);
    setNotifyMessage('');
    try {
      await solicitationService.sendNotification(id, {
        message: notifyForm.message,
        recipientCount: parseInt(notifyForm.recipientCount, 10),
      });
      setNotifyForm({ message: '', recipientCount: '' });
      setShowNotifyForm(false);
      setNotifyMessage('Notification sent successfully');
      await fetchDetail();
    } catch (err) {
      setNotifyMessage(err.response?.data?.error || 'Failed to send notification');
    } finally {
      setNotifyLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading solicitation details...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!solicitation) return <div className="empty-state">Solicitation not found.</div>;

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2>{solicitation.Title}</h2>
          <div className="actions-row">
            <Link to={`/solicitations/${id}/edit`} className="btn btn-primary">Edit</Link>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
            <Link to="/solicitations" className="btn btn-secondary">Back to List</Link>
          </div>
        </div>

        <div className="detail-section">
          <h3>Solicitation Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="label">Type</div>
              <div className="value">{solicitation.SolicitationType}</div>
            </div>
            <div className="detail-item">
              <div className="label">Status</div>
              <div className="value"><StatusBadge status={solicitation.Status} /></div>
            </div>
            <div className="detail-item">
              <div className="label">Posted Date</div>
              <div className="value">{formatDate(solicitation.PostedDate)}</div>
            </div>
            <div className="detail-item">
              <div className="label">Deadline</div>
              <div className="value">{formatDate(solicitation.Deadline)}</div>
            </div>
            {solicitation.Status === 'Awarded' && (
              <>
                <div className="detail-item">
                  <div className="label">Awarded Vendor ID</div>
                  <div className="value">{solicitation.AwardedVendorID || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="label">Award Date</div>
                  <div className="value">{formatDate(solicitation.AwardDate)}</div>
                </div>
              </>
            )}
            <div className="detail-item">
              <div className="label">Created</div>
              <div className="value">{formatDateTime(solicitation.CreatedDate)}</div>
            </div>
            <div className="detail-item">
              <div className="label">Last Modified</div>
              <div className="value">{formatDateTime(solicitation.ModifiedDate)}</div>
            </div>
          </div>
        </div>

        {solicitation.Description && (
          <div className="detail-section">
            <h3>Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.7 }}>
              {solicitation.Description}
            </p>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="card">
        <div className="card-header">
          <h2>Documents ({solicitation.documents?.length || 0})</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setShowDocForm(!showDocForm)}>
            {showDocForm ? 'Cancel' : '+ Add Document'}
          </button>
        </div>

        {docMessage && (
          <div className={`alert ${docMessage.includes('success') ? 'alert-success' : 'alert-error'}`}>
            {docMessage}
          </div>
        )}

        {showDocForm && (
          <form className="notify-form" onSubmit={handleAddDocument} style={{ marginBottom: 16 }}>
            <div className="form-row">
              <div className="form-group">
                <label>File Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={docForm.fileName}
                  onChange={(e) => setDocForm({ ...docForm, fileName: e.target.value })}
                  placeholder="e.g. Scope_of_Work.pdf"
                  required
                />
              </div>
              <div className="form-group">
                <label>File Type</label>
                <select
                  className="form-control"
                  value={docForm.fileType}
                  onChange={(e) => setDocForm({ ...docForm, fileType: e.target.value })}
                  required
                >
                  <option value="">Select type</option>
                  <option value="PDF">PDF</option>
                  <option value="Word">Word</option>
                  <option value="Excel">Excel</option>
                  <option value="Image">Image</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                className="form-control"
                value={docForm.description}
                onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                placeholder="Brief description of the document"
              />
            </div>
            <button type="submit" className="btn btn-success btn-sm" disabled={docLoading}>
              {docLoading ? 'Adding...' : 'Add Document'}
            </button>
          </form>
        )}

        {solicitation.documents?.length > 0 ? (
          <ul className="document-list">
            {solicitation.documents.map((doc) => (
              <li key={doc.DocumentID}>
                <div>
                  <span className="doc-name">{doc.FileName}</span>
                  {doc.Description && <span className="doc-meta"> - {doc.Description}</span>}
                </div>
                <div className="doc-meta">
                  {doc.FileType} | {formatDate(doc.UploadDate)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">No documents attached.</div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="card">
        <div className="card-header">
          <h2>Notification History</h2>
          <button className="btn btn-warning btn-sm" onClick={() => setShowNotifyForm(!showNotifyForm)}>
            {showNotifyForm ? 'Cancel' : 'Send Notification'}
          </button>
        </div>

        {notifyMessage && (
          <div className={`alert ${notifyMessage.includes('success') ? 'alert-success' : 'alert-error'}`}>
            {notifyMessage}
          </div>
        )}

        {showNotifyForm && (
          <form className="notify-form" onSubmit={handleSendNotification} style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>Message</label>
              <textarea
                className="form-control"
                value={notifyForm.message}
                onChange={(e) => setNotifyForm({ ...notifyForm, message: e.target.value })}
                placeholder="Enter notification message for vendors..."
                required
                style={{ minHeight: 80 }}
              />
            </div>
            <div className="form-group">
              <label>Recipient Count</label>
              <input
                type="number"
                className="form-control"
                value={notifyForm.recipientCount}
                onChange={(e) => setNotifyForm({ ...notifyForm, recipientCount: e.target.value })}
                placeholder="Number of recipients"
                min="1"
                required
                style={{ maxWidth: 200 }}
              />
            </div>
            <button type="submit" className="btn btn-warning btn-sm" disabled={notifyLoading}>
              {notifyLoading ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        )}

        {solicitation.notifications?.length > 0 ? (
          <ul className="notification-list">
            {solicitation.notifications.map((notif) => (
              <li key={notif.NotificationID}>
                <div className="notif-date">
                  {formatDateTime(notif.SentDate)}
                  <span className="notif-recipients"> - {notif.RecipientCount} recipients</span>
                </div>
                <div style={{ marginTop: 4 }}>{notif.Message}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">No notifications sent yet.</div>
        )}
      </div>
    </>
  );
}
