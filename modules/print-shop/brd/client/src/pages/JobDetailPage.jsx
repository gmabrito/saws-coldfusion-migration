import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { jobService } from '../services/api';

const STATUS_BADGES = {
  Submitted: 'badge badge-submitted',
  InProgress: 'badge badge-inprogress',
  Completed: 'badge badge-completed',
  Cancelled: 'badge badge-cancelled',
};

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await jobService.getById(id);
      setJob(res.data);
    } catch (err) {
      setError('Failed to load print job');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await jobService.update(id, { status: newStatus });
      fetchJob();
    } catch (err) {
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this print job?')) return;
    setUpdating(true);
    try {
      await jobService.cancel(id);
      fetchJob();
    } catch (err) {
      setError('Failed to cancel job');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!job) return <div className="page"><p>Job not found.</p></div>;

  // Build timeline events
  const timeline = [];
  if (job.RequestDate) timeline.push({ date: job.RequestDate, text: 'Job submitted' });
  if (job.Status === 'InProgress') timeline.push({ date: null, text: 'Job in progress' });
  if (job.CompletedDate) timeline.push({ date: job.CompletedDate, text: 'Job completed' });
  if (job.Status === 'Cancelled') timeline.push({ date: null, text: 'Job cancelled' });

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Print Job #{job.JobID}</h2>
        <Link to="/jobs" className="btn btn-secondary btn-sm">Back to Jobs</Link>
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <div className="label">Title</div>
          <div className="value">{job.Title}</div>
        </div>
        <div className="detail-item">
          <div className="label">Status</div>
          <div className="value">
            <span className={STATUS_BADGES[job.Status] || 'badge'}>{job.Status}</span>
            {job.RushOrder ? <span className="badge badge-rush" style={{ marginLeft: 8 }}>Rush</span> : null}
          </div>
        </div>
        <div className="detail-item">
          <div className="label">Quantity</div>
          <div className="value">{job.Quantity}</div>
        </div>
        <div className="detail-item">
          <div className="label">Paper Size</div>
          <div className="value">{job.PaperSize}</div>
        </div>
        <div className="detail-item">
          <div className="label">Color Type</div>
          <div className="value">{job.ColorType}</div>
        </div>
        <div className="detail-item">
          <div className="label">Department</div>
          <div className="value">{job.DepartmentName}</div>
        </div>
        <div className="detail-item">
          <div className="label">Requested By</div>
          <div className="value">{job.RequestedBy}</div>
        </div>
        <div className="detail-item">
          <div className="label">Request Date</div>
          <div className="value">{new Date(job.RequestDate).toLocaleDateString()}</div>
        </div>
      </div>

      {job.Description && (
        <>
          <h3>Description</h3>
          <p style={{ marginBottom: 16 }}>{job.Description}</p>
        </>
      )}

      {job.Notes && (
        <>
          <h3>Notes</h3>
          <p style={{ marginBottom: 16 }}>{job.Notes}</p>
        </>
      )}

      <h3>Status Timeline</h3>
      <div className="timeline">
        {timeline.map((item, idx) => (
          <div key={idx} className="timeline-item">
            <div className="timeline-date">{item.date ? new Date(item.date).toLocaleString() : 'Pending'}</div>
            <div className="timeline-text">{item.text}</div>
          </div>
        ))}
      </div>

      {isAdmin && job.Status !== 'Completed' && job.Status !== 'Cancelled' && (
        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          {job.Status === 'Submitted' && (
            <button className="btn btn-warning btn-sm" onClick={() => handleStatusUpdate('InProgress')} disabled={updating}>
              Start Processing
            </button>
          )}
          {job.Status === 'InProgress' && (
            <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate('Completed')} disabled={updating}>
              Mark Completed
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={updating}>
            Cancel Job
          </button>
        </div>
      )}
    </div>
  );
}
