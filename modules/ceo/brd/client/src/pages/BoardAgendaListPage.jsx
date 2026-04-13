import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { agendaService } from '../services/api';
import { useAuth } from '../components/AuthContext';

export default function BoardAgendaListPage() {
  const { user } = useAuth();
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAgendas();
  }, [statusFilter]);

  async function fetchAgendas() {
    setLoading(true);
    setError('');
    try {
      const params = { type: 'Board' };
      if (statusFilter) params.status = statusFilter;
      const data = await agendaService.list(params);
      setAgendas(data);
    } catch (err) {
      setError('Failed to load board agendas');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  // BRD 7.2: Separate archived vs upcoming
  const archivedAgendas = agendas.filter(a => a.Status === 'Archived');
  const activeAgendas = agendas.filter(a => a.Status !== 'Archived');

  return (
    <div className="page">
      <div className="page-header">
        <h2>Board Meeting Agendas</h2>
        <div className="btn-group">
          <Link to="/subscribe" className="btn btn-success">Subscribe to Notifications</Link>
          {user && (
            <Link to="/agendas/new?type=Board" className="btn btn-primary">New Board Agenda</Link>
          )}
        </div>
      </div>

      {/* BRD 7.2: Centralized location for board meetings */}
      <div className="alert alert-info">
        Centralized location for board meeting agendas and archives. Meeting schedules, accessibility information,
        and notification sign-ups are available for all board meetings.
      </div>

      <div className="filters">
        <div className="form-group">
          <label>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading board agendas...</div>
      ) : agendas.length === 0 ? (
        <div className="empty-state">
          <p>No board agendas found.</p>
          {user && <Link to="/agendas/new?type=Board" className="btn btn-primary">Create First Agenda</Link>}
        </div>
      ) : (
        <>
          {/* Upcoming / Published agendas */}
          {activeAgendas.length > 0 && (
            <>
              <h3>Upcoming &amp; Published Meetings</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Meeting Date</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Accessibility</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAgendas.map(agenda => (
                      <tr key={agenda.AgendaID}>
                        <td>
                          <Link to={`/agendas/${agenda.AgendaID}`}>{agenda.Title}</Link>
                        </td>
                        <td>{formatDate(agenda.MeetingDate)}</td>
                        <td>{agenda.Location || '-'}</td>
                        <td>
                          <span className={`badge badge-${agenda.Status?.toLowerCase()}`}>
                            {agenda.Status}
                          </span>
                        </td>
                        <td>
                          {agenda.AccessibilityNotes ? (
                            <span className="badge badge-published" title={agenda.AccessibilityNotes}>Accessible</span>
                          ) : '-'}
                        </td>
                        <td>
                          <Link to={`/agendas/${agenda.AgendaID}`} className="btn btn-sm btn-primary">View</Link>
                          {user && (
                            <Link to={`/agendas/${agenda.AgendaID}/edit`} className="btn btn-sm btn-secondary" style={{ marginLeft: 4 }}>
                              Edit
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* BRD 7.2: Archived board meetings */}
          {archivedAgendas.length > 0 && (
            <>
              <h3 style={{ marginTop: 24 }}>Archived Meetings</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Meeting Date</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedAgendas.map(agenda => (
                      <tr key={agenda.AgendaID}>
                        <td>
                          <Link to={`/agendas/${agenda.AgendaID}`}>{agenda.Title}</Link>
                        </td>
                        <td>{formatDate(agenda.MeetingDate)}</td>
                        <td>{agenda.Location || '-'}</td>
                        <td>
                          <Link to={`/agendas/${agenda.AgendaID}`} className="btn btn-sm btn-primary">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
