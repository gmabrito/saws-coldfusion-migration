import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { agendaService } from '../services/api';
import { useAuth } from '../components/AuthContext';

export default function AgendaDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Document form state
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ fileName: '', fileType: '', description: '' });
  const [docError, setDocError] = useState('');
  const [docSuccess, setDocSuccess] = useState('');

  useEffect(() => {
    fetchAgenda();
  }, [id]);

  async function fetchAgenda() {
    setLoading(true);
    setError('');
    try {
      const data = await agendaService.getById(id);
      setAgenda(data);
    } catch (err) {
      setError(err.response?.status === 404 ? 'Agenda not found' : 'Failed to load agenda');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await agendaService.delete(id);
      navigate(agenda.AgendaType === 'Committee' ? '/committee-agendas' : '/board-agendas');
    } catch (err) {
      setError('Failed to delete agenda');
    }
  }

  async function handleAddDocument(e) {
    e.preventDefault();
    setDocError('');
    setDocSuccess('');
    if (!docForm.fileName.trim()) {
      setDocError('File name is required');
      return;
    }
    try {
      await agendaService.addDocument(id, docForm);
      setDocSuccess('Document added successfully');
      setDocForm({ fileName: '', fileType: '', description: '' });
      setShowDocForm(false);
      fetchAgenda();
    } catch (err) {
      setDocError('Failed to add document');
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  if (loading) return <div className="loading">Loading agenda...</div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div><Link to="/" className="back-link">Back to agendas</Link></div>;
  if (!agenda) return null;

  const backLink = agenda.AgendaType === 'Committee' ? '/committee-agendas' : '/board-agendas';

  return (
    <div className="page">
      <Link to={backLink} className="back-link">
        &larr; Back to {agenda.AgendaType === 'Committee' ? 'Committee' : 'Board'} Agendas
      </Link>

      <div className="page-header">
        <h2>{agenda.Title}</h2>
        {user && (
          <div className="btn-group">
            <Link to={`/agendas/${id}/edit`} className="btn btn-secondary">Edit</Link>
            {!deleteConfirm ? (
              <button className="btn btn-danger" onClick={() => setDeleteConfirm(true)}>Delete</button>
            ) : (
              <>
                <button className="btn btn-danger" onClick={handleDelete}>Confirm Delete</button>
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <div className="label">Agenda Type</div>
          <div className="value">
            <span className={`badge badge-${agenda.AgendaType?.toLowerCase()}`}>{agenda.AgendaType}</span>
          </div>
        </div>
        {agenda.CommitteeType && (
          <div className="detail-item">
            <div className="label">Committee</div>
            <div className="value">
              <span className={`badge badge-${agenda.CommitteeType?.toLowerCase()}`}>{agenda.CommitteeType}</span>
            </div>
          </div>
        )}
        <div className="detail-item">
          <div className="label">Meeting Date</div>
          <div className="value">{formatDate(agenda.MeetingDate)}</div>
        </div>
        <div className="detail-item">
          <div className="label">Status</div>
          <div className="value">
            <span className={`badge badge-${agenda.Status?.toLowerCase()}`}>{agenda.Status}</span>
          </div>
        </div>
        <div className="detail-item">
          <div className="label">Location</div>
          <div className="value">{agenda.Location || 'Not specified'}</div>
        </div>
        <div className="detail-item">
          <div className="label">Created</div>
          <div className="value">{formatDate(agenda.CreatedDate)}</div>
        </div>
      </div>

      {agenda.Description && (
        <>
          <h3>Description</h3>
          <div className="description-block">{agenda.Description}</div>
        </>
      )}

      {/* BRD 7.2: Handicap accessibility info */}
      {agenda.AccessibilityNotes && (
        <div className="accessibility-info">
          <h4>Accessibility Information</h4>
          <p>{agenda.AccessibilityNotes}</p>
        </div>
      )}

      {/* BRD 7.1: Manage committee documents */}
      <h3>Attached Documents</h3>
      {docSuccess && <div className="alert alert-success">{docSuccess}</div>}
      {docError && <div className="alert alert-error">{docError}</div>}

      {agenda.documents && agenda.documents.length > 0 ? (
        <ul className="document-list">
          {agenda.documents.map(doc => (
            <li key={doc.DocumentID}>
              <div>
                <span className="doc-name">{doc.FileName}</span>
                {doc.FileType && <span className="doc-type">({doc.FileType})</span>}
                {doc.Description && <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{doc.Description}</div>}
              </div>
              <span className="doc-date">{new Date(doc.UploadDate).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#999', margin: '12px 0' }}>No documents attached.</p>
      )}

      {user && (
        <>
          {!showDocForm ? (
            <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={() => setShowDocForm(true)}>
              Add Document
            </button>
          ) : (
            <form onSubmit={handleAddDocument} style={{ marginTop: 12, padding: 16, background: '#f8f9fa', borderRadius: 4 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>File Name *</label>
                  <input
                    type="text"
                    value={docForm.fileName}
                    onChange={e => setDocForm({ ...docForm, fileName: e.target.value })}
                    placeholder="e.g. Q4-Audit-Report.pdf"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>File Type</label>
                  <select value={docForm.fileType} onChange={e => setDocForm({ ...docForm, fileType: e.target.value })}>
                    <option value="">Select type</option>
                    <option value="PDF">PDF</option>
                    <option value="Word">Word</option>
                    <option value="Excel">Excel</option>
                    <option value="PowerPoint">PowerPoint</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={docForm.description}
                  onChange={e => setDocForm({ ...docForm, description: e.target.value })}
                  placeholder="Brief description of the document"
                />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-sm btn-primary">Save Document</button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowDocForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
