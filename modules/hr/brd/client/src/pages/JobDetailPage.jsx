import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';
import { useAuth } from '../components/AuthContext';

// Ref: BRD 6.1 - Full job description view
export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const { data } = await jobService.getById(id);
      setJob(data);
    } catch (err) {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this job listing?')) return;
    try {
      setDeleting(true);
      await jobService.remove(id);
      navigate('/jobs');
    } catch (err) {
      setError('Failed to delete job listing');
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) return <div className="loading">Loading job details...</div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!job) return <div className="page"><div className="alert alert-error">Job listing not found.</div></div>;

  return (
    <div className="page">
      <div className="action-bar">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/jobs')}>
          Back to Listings
        </button>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/jobs/${id}/edit`)}>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <h2>{job.Title}</h2>

      <div className="detail-grid">
        <div className="detail-item">
          <div className="label">Department</div>
          <div className="value">{job.Department}</div>
        </div>
        <div className="detail-item">
          <div className="label">Position Type</div>
          <div className="value">
            <span className={`badge badge-${job.JobType.toLowerCase()}`}>{job.JobType}</span>
          </div>
        </div>
        <div className="detail-item">
          <div className="label">Posted Date</div>
          <div className="value">{formatDate(job.PostedDate)}</div>
        </div>
        <div className="detail-item">
          <div className="label">Expiration Date</div>
          <div className="value">{formatDate(job.ExpirationDate)}</div>
        </div>
        {job.SalaryRange && (
          <div className="detail-item">
            <div className="label">Salary Range</div>
            <div className="value">{job.SalaryRange}</div>
          </div>
        )}
        <div className="detail-item">
          <div className="label">Status</div>
          <div className="value">
            <span className={`badge badge-${job.Status.toLowerCase()}`}>{job.Status}</span>
          </div>
        </div>
      </div>

      <h3>Description</h3>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 20 }}>{job.Description}</p>

      {job.Requirements && (
        <>
          <h3>Requirements</h3>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{job.Requirements}</p>
        </>
      )}
    </div>
  );
}
