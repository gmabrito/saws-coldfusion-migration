import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../services/api';

const STATUS_BADGES = {
  Submitted: 'badge badge-submitted',
  InProgress: 'badge badge-inprogress',
  Completed: 'badge badge-completed',
  Cancelled: 'badge badge-cancelled',
};

export default function JobListPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, departmentFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.departmentId = departmentFilter;
      const res = await jobService.getAll(params);
      setJobs(res.data);
    } catch (err) {
      setError('Failed to load print jobs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Print Jobs</h2>
        <Link to="/jobs/new" className="btn btn-primary">New Print Request</Link>
      </div>

      <div className="filters">
        <div className="form-group">
          <label>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="form-group">
          <label>Department</label>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="">All Departments</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : jobs.length === 0 ? (
        <p>No print jobs found.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Job #</th>
                <th>Title</th>
                <th>Quantity</th>
                <th>Paper Size</th>
                <th>Color</th>
                <th>Department</th>
                <th>Rush</th>
                <th>Status</th>
                <th>Requested</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.JobID}>
                  <td><Link to={`/jobs/${job.JobID}`}>{job.JobID}</Link></td>
                  <td><Link to={`/jobs/${job.JobID}`}>{job.Title}</Link></td>
                  <td>{job.Quantity}</td>
                  <td>{job.PaperSize}</td>
                  <td>{job.ColorType}</td>
                  <td>{job.DepartmentName}</td>
                  <td>{job.RushOrder ? <span className="badge badge-rush">Rush</span> : 'No'}</td>
                  <td><span className={STATUS_BADGES[job.Status] || 'badge'}>{job.Status}</span></td>
                  <td>{new Date(job.RequestDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
