import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { agendaService } from '../services/api';
import { useAuth } from '../components/AuthContext';

export default function CommitteeAgendaListPage() {
  const { user } = useAuth();
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchAgendas();
  }, [committeeFilter, statusFilter]);

  async function fetchAgendas() {
    setLoading(true);
    setError('');
    try {
      const params = { type: 'Committee' };
      if (committeeFilter) params.committeeType = committeeFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await agendaService.list(params);
      setAgendas(data);
    } catch (err) {
      setError('Failed to load committee agendas');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Board Committee Agendas</h2>
        {user && (
          <Link to="/agendas/new?type=Committee" className="btn btn-primary">
            New Committee Agenda
          </Link>
        )}
      </div>

      {/* BRD 7.1: Audit Committee and Compensation Committee */}
      <div className="alert alert-info">
        Manage agendas for the <strong>Audit Committee</strong> (financial reporting, internal controls, audit functions)
        and <strong>Compensation Committee</strong> (CEO performance appraisal, compensation, succession planning).
      </div>

      <div className="filters">
        <div className="form-group">
          <label>Committee</label>
          <select value={committeeFilter} onChange={e => setCommitteeFilter(e.target.value)}>
            <option value="">All Committees</option>
            <option value="Audit">Audit Committee</option>
            <option value="Compensation">Compensation Committee</option>
          </select>
        </div>
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
        <div className="loading">Loading committee agendas...</div>
      ) : agendas.length === 0 ? (
        <div className="empty-state">
          <p>No committee agendas found.</p>
          {user && <Link to="/agendas/new?type=Committee" className="btn btn-primary">Create First Agenda</Link>}
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Committee</th>
                <th>Meeting Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {agendas.map(agenda => (
                <tr key={agenda.AgendaID}>
                  <td>
                    <Link to={`/agendas/${agenda.AgendaID}`}>{agenda.Title}</Link>
                  </td>
                  <td>
                    <span className={`badge badge-${agenda.CommitteeType?.toLowerCase()}`}>
                      {agenda.CommitteeType}
                    </span>
                  </td>
                  <td>{formatDate(agenda.MeetingDate)}</td>
                  <td>
                    <span className={`badge badge-${agenda.Status?.toLowerCase()}`}>
                      {agenda.Status}
                    </span>
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
      )}
    </div>
  );
}
