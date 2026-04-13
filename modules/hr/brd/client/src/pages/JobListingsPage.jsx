import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';
import { useAuth } from '../components/AuthContext';

// Ref: BRD 6.1 - Public view of all active jobs
// "jobs (internally and externally) elaborating the specific of each position available"
export default function JobListingsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('All');
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { data } = await jobService.getAll();
      setJobs(data);
    } catch (err) {
      setError('Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = filterType === 'All'
    ? jobs
    : jobs.filter((j) => j.JobType === filterType);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="loading">Loading job listings...</div>;

  return (
    <div className="page">
      <div className="action-bar">
        <h2>Job Listings</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => navigate('/jobs/new')}>
            Post New Job
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <div className="form-group">
          <label>Filter by Type</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="All">All Positions</option>
            <option value="Internal">Internal</option>
            <option value="External">External</option>
          </select>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>
          Showing {filteredJobs.length} of {jobs.length} listing{jobs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="alert alert-info">No active job listings at this time.</div>
      ) : (
        filteredJobs.map((job) => (
          <div key={job.ListingID} className="job-card" onClick={() => navigate(`/jobs/${job.ListingID}`)}>
            <h3>{job.Title}</h3>
            <div className="job-card-meta">
              <span><strong>Department:</strong> {job.Department}</span>
              <span>
                <span className={`badge badge-${job.JobType.toLowerCase()}`}>{job.JobType}</span>
              </span>
              <span><strong>Posted:</strong> {formatDate(job.PostedDate)}</span>
              {job.SalaryRange && <span><strong>Salary:</strong> {job.SalaryRange}</span>}
            </div>
            {job.ExpirationDate && (
              <p style={{ fontSize: 12, color: '#999' }}>Expires: {formatDate(job.ExpirationDate)}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
