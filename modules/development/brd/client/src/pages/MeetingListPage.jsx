import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { meetingService } from '../services/api';

export default function MeetingListPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    setLoading(true);
    try {
      const res = await meetingService.list();
      setMeetings(res.data);
    } catch (err) {
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await meetingService.delete(id);
      setMeetings((prev) => prev.filter((m) => m.MeetingID !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete meeting');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  function statusBadge(status) {
    const cls = {
      Scheduled: 'badge-scheduled',
      'In Progress': 'badge-in-progress',
      Completed: 'badge-completed',
      Cancelled: 'badge-cancelled',
    }[status] || '';
    return <span className={`badge ${cls}`}>{status}</span>;
  }

  if (loading) return <div className="loading">Loading meetings...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h2>CIAC Meeting Board</h2>
        <Link to="/meetings/new" className="btn btn-primary">+ New Meeting</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {meetings.length === 0 ? (
        <div className="empty-state">No meetings scheduled. Create a new meeting to get started.</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((m) => (
              <tr key={m.MeetingID}>
                <td>{formatDate(m.MeetingDate)}</td>
                <td>
                  <Link to={`/meetings/${m.MeetingID}`}>{m.Title}</Link>
                </td>
                <td>{m.Location}</td>
                <td>{statusBadge(m.Status)}</td>
                <td>
                  <div className="actions-row">
                    <Link to={`/meetings/${m.MeetingID}`} className="btn btn-sm btn-secondary">View</Link>
                    <Link to={`/meetings/${m.MeetingID}/edit`} className="btn btn-sm btn-primary">Edit</Link>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(m.MeetingID)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
