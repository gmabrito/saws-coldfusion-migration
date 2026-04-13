import { useState, useEffect } from 'react';
import { contractService } from '../services/api';

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const { data } = await contractService.getAll({ status: 'Pending' });
      setContracts(data);
    } catch {
      setError('Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    setActionLoading(true);
    try {
      await contractService.review(id, { status, reviewNotes });
      setReviewingId(null);
      setReviewNotes('');
      loadContracts();
    } catch (err) {
      setError(err.response?.data?.error || 'Review failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h2>Admin - Pending Contract Applications</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Review and approve or deny fire hydrant meter contract applications.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      {contracts.length === 0 ? (
        <div className="alert alert-info">No pending applications to review.</div>
      ) : (
        contracts.map((c) => (
          <div key={c.ContractID} className="page" style={{ marginBottom: '16px', border: '1px solid #e9ecef' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>#{c.ContractID} - {c.BusinessName}</h3>
              <span className="badge badge-pending">Pending</span>
            </div>

            <div className="detail-grid" style={{ marginTop: '12px' }}>
              <div className="detail-item">
                <div className="label">Applicant</div>
                <div className="value">{c.ApplicantName}</div>
              </div>
              <div className="detail-item">
                <div className="label">Email</div>
                <div className="value">{c.Email}</div>
              </div>
              <div className="detail-item">
                <div className="label">Phone</div>
                <div className="value">{c.Phone}</div>
              </div>
              <div className="detail-item">
                <div className="label">Meter Size</div>
                <div className="value">{c.MeterSize}</div>
              </div>
              <div className="detail-item">
                <div className="label">Location</div>
                <div className="value">{c.MeterLocation}</div>
              </div>
              <div className="detail-item">
                <div className="label">Applied</div>
                <div className="value">{new Date(c.ApplicationDate).toLocaleDateString()}</div>
              </div>
            </div>

            {reviewingId === c.ContractID ? (
              <div style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label>Review Notes</label>
                  <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Optional review notes..." />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-success btn-sm" onClick={() => handleReview(c.ContractID, 'Approved')} disabled={actionLoading}>
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleReview(c.ContractID, 'Denied')} disabled={actionLoading}>
                    Deny
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setReviewingId(null); setReviewNotes(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => setReviewingId(c.ContractID)}>
                Review
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
