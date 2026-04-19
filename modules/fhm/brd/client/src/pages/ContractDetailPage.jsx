import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contractService } from '../services/api';

export default function ContractDetailPage() {
  const { id } = useParams();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContract();
  }, [id]);

  const loadContract = async () => {
    try {
      const { data } = await contractService.getById(id);
      setContract(data);
    } catch {
      setError('Failed to load contract details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const classes = { Pending: 'badge badge-pending', Approved: 'badge badge-approved', Denied: 'badge badge-denied' };
    return <span className={classes[status] || 'badge'}>{status}</span>;
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!contract) return <div className="page"><p>Contract not found.</p></div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Contract #{contract.ContractID}</h2>
        {getStatusBadge(contract.Status)}
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <div className="label">Applicant Name</div>
          <div className="value">{contract.ApplicantName}</div>
        </div>
        <div className="detail-item">
          <div className="label">Business Name</div>
          <div className="value">{contract.BusinessName}</div>
        </div>
        <div className="detail-item">
          <div className="label">Email</div>
          <div className="value">{contract.Email}</div>
        </div>
        <div className="detail-item">
          <div className="label">Phone</div>
          <div className="value">{contract.Phone}</div>
        </div>
        <div className="detail-item">
          <div className="label">Meter Size</div>
          <div className="value">{contract.MeterSize}</div>
        </div>
        <div className="detail-item">
          <div className="label">Meter Location</div>
          <div className="value">{contract.MeterLocation}</div>
        </div>
        <div className="detail-item">
          <div className="label">Estimated Duration</div>
          <div className="value">{contract.EstimatedDuration}</div>
        </div>
        <div className="detail-item">
          <div className="label">Application Date</div>
          <div className="value">{new Date(contract.ApplicationDate).toLocaleDateString()}</div>
        </div>
      </div>

      {contract.ProjectDescription && (
        <>
          <h3>Project Description</h3>
          <p style={{ marginBottom: '16px' }}>{contract.ProjectDescription}</p>
        </>
      )}

      {contract.ApprovedDate && (
        <div className="detail-grid">
          <div className="detail-item">
            <div className="label">Reviewed By</div>
            <div className="value">{contract.ApprovedByName || 'N/A'}</div>
          </div>
          <div className="detail-item">
            <div className="label">Review Date</div>
            <div className="value">{new Date(contract.ApprovedDate).toLocaleDateString()}</div>
          </div>
        </div>
      )}

      {contract.ReviewNotes && (
        <>
          <h3>Review Notes</h3>
          <p style={{ marginBottom: '16px' }}>{contract.ReviewNotes}</p>
        </>
      )}

      <Link to="/contracts" className="btn btn-secondary" style={{ marginTop: '16px' }}>Back to Contracts</Link>
    </div>
  );
}
