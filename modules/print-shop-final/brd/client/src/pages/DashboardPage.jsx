import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../services/api';

const STATUS_BADGES = {
  Submitted: 'badge badge-submitted',
  InProgress: 'badge badge-inprogress',
  Completed: 'badge badge-completed',
  Cancelled: 'badge badge-cancelled',
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await jobService.getDashboard();
      setDashboard(res.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page"><p>Loading dashboard...</p></div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!dashboard) return <div className="page"><p>No data available.</p></div>;

  const getStatusCount = (status) => {
    const item = dashboard.byStatus.find((s) => s.Status === status);
    return item ? item.count : 0;
  };

  return (
    <div>
      <h2 style={{ color: '#005A87', marginBottom: 20 }}>Print Shop Dashboard</h2>

      <div className="dashboard-cards">
        <div className="dashboard-card card-total">
          <div className="card-value">{dashboard.total}</div>
          <div className="card-label">Total Jobs</div>
        </div>
        <div className="dashboard-card card-submitted">
          <div className="card-value">{getStatusCount('Submitted')}</div>
          <div className="card-label">Submitted</div>
        </div>
        <div className="dashboard-card card-inprogress">
          <div className="card-value">{getStatusCount('InProgress')}</div>
          <div className="card-label">In Progress</div>
        </div>
        <div className="dashboard-card card-completed">
          <div className="card-value">{getStatusCount('Completed')}</div>
          <div className="card-label">Completed</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="dashboard-section">
          <h3>Recent Jobs</h3>
          {dashboard.recentJobs.length === 0 ? (
            <p>No recent jobs.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Job #</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentJobs.map((job) => (
                    <tr key={job.JobID}>
                      <td><Link to={`/jobs/${job.JobID}`}>{job.JobID}</Link></td>
                      <td>{job.Title}</td>
                      <td>
                        <span className={STATUS_BADGES[job.Status] || 'badge'}>{job.Status}</span>
                        {job.RushOrder ? <span className="badge badge-rush" style={{ marginLeft: 4 }}>Rush</span> : null}
                      </td>
                      <td>{new Date(job.RequestDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h3>Jobs by Department</h3>
          {dashboard.byDepartment.length === 0 ? (
            <p>No department data.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Jobs</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.byDepartment.map((dept, idx) => (
                    <tr key={idx}>
                      <td>{dept.DepartmentName}</td>
                      <td>{dept.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
