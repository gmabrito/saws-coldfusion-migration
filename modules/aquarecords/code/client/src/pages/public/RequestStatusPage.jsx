import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import StatusBadge from '../../components/StatusBadge';

export default function RequestStatusPage() {
  const [searchParams] = useSearchParams();
  const [confirmationNo, setConfirmationNo] = useState(searchParams.get('ref') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLookup(e) {
    e.preventDefault();
    if (!confirmationNo.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await requestService.getPublicStatus(confirmationNo.trim());
      setResult(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No request found with that confirmation number. Please check the number and try again.');
      } else {
        setError('Unable to look up your request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="public-content">
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--saws-navy)', marginBottom: 8 }}>
        Check Request Status
      </h2>
      <p style={{ marginBottom: 24, color: 'var(--saws-text-muted)' }}>
        Enter your confirmation number to check the status of your public records request.
      </p>

      <form onSubmit={handleLookup}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            type="text"
            value={confirmationNo}
            onChange={(e) => setConfirmationNo(e.target.value)}
            placeholder="e.g. TPIA-2026-000001"
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid var(--saws-border)',
              borderRadius: 'var(--radius)',
              fontSize: 15,
              fontFamily: 'monospace',
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Looking up...' : 'Check Status'}
          </button>
        </div>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {result && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Request {result.confirmationNo}</span>
            <StatusBadge status={result.status} />
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Submitted</span>
              <span className="detail-value">
                {new Date(result.submitted_at).toLocaleDateString()}
              </span>
            </div>
            {result.acknowledged_at && (
              <div className="detail-item">
                <span className="detail-label">Acknowledged</span>
                <span className="detail-value">
                  {new Date(result.acknowledged_at).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Due Date</span>
              <span className="detail-value">
                {new Date(result.due_date).toLocaleDateString()}
              </span>
            </div>
            {result.estimated_response_date && (
              <div className="detail-item">
                <span className="detail-label">Estimated Response</span>
                <span className="detail-value">
                  {new Date(result.estimated_response_date).toLocaleDateString()}
                </span>
              </div>
            )}
            {result.assigned_department && (
              <div className="detail-item">
                <span className="detail-label">Assigned Department</span>
                <span className="detail-value">{result.assigned_department}</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--saws-light)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--saws-text-muted)' }}>
            If you have questions about your request, contact the SAWS Open Records office at{' '}
            <a href="mailto:openrecords@saws.org">openrecords@saws.org</a>.
          </div>
        </div>
      )}
    </div>
  );
}
