import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { transmittalService } from '../services/api';

function StatusBadge({ status }) {
  const classMap = {
    Draft: 'badge-draft',
    Submitted: 'badge-submitted',
    Reviewed: 'badge-reviewed',
    'In Storage': 'badge-in-storage',
    Disposed: 'badge-disposed'
  };
  return <span className={`badge ${classMap[status] || ''}`}>{status}</span>;
}

export default function TransmittalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transmittal, setTransmittal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await transmittalService.getById(id);
        setTransmittal(response.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load transmittal.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this transmittal? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await transmittalService.delete(id);
      navigate('/transmittals');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete transmittal.');
      setDeleting(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading transmittal details...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!transmittal) {
    return <div className="alert alert-error">Transmittal not found.</div>;
  }

  const canEdit = transmittal.Status === 'Draft' || transmittal.Status === 'Submitted';
  const canDelete = user?.role === 'admin' || user?.role === 'records';

  return (
    <div>
      {/* Header card */}
      <div className="card">
        <div className="card-header">
          <h2>Transmittal #{transmittal.TransmittalID}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {canEdit && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/transmittals/${id}/edit`)}
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/transmittals')}
            >
              Back to List
            </button>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Department</div>
            <div className="detail-value">{transmittal.DepartmentName}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Submitted By</div>
            <div className="detail-value">{transmittal.SubmittedByName}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Submit Date</div>
            <div className="detail-value">{formatDate(transmittal.SubmitDate)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <div className="detail-value"><StatusBadge status={transmittal.Status} /></div>
          </div>
          <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
            <div className="detail-label">Notes</div>
            <div className="detail-value">{transmittal.Notes || 'No notes'}</div>
          </div>
        </div>
      </div>

      {/* Box Indexes */}
      <div className="card">
        <div className="card-header">
          <h2>Box Indexes ({transmittal.boxes?.length || 0})</h2>
        </div>

        {!transmittal.boxes || transmittal.boxes.length === 0 ? (
          <div className="empty-state">
            <p>No box indexes recorded.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Box Number</th>
                  <th>Description</th>
                  <th>Retention Code</th>
                  <th>Retention Date</th>
                  <th>Disposition Date</th>
                  <th>Location</th>
                  <th>Keywords</th>
                </tr>
              </thead>
              <tbody>
                {transmittal.boxes.map((box) => (
                  <tr key={box.BoxID}>
                    <td style={{ fontWeight: 600 }}>{box.BoxNumber}</td>
                    <td>{box.Description}</td>
                    <td>
                      <span title={box.RetentionCodeDescription}>
                        {box.RetentionCode}
                      </span>
                      <br />
                      <small style={{ color: '#6c757d' }}>{box.RetentionCodeDescription} ({box.RetentionYears}yr)</small>
                    </td>
                    <td>{formatDate(box.RetentionDate)}</td>
                    <td>{formatDate(box.DispositionDate)}</td>
                    <td>{box.Location || '-'}</td>
                    <td>{box.Keywords || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
