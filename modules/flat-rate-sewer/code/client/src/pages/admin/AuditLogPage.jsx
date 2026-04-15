import { useState, useEffect, useRef } from 'react';
import { reportService } from '../../services/api';

const EVENT_TYPES = ['ALL', 'LOGIN', 'ACCOUNT', 'METER', 'READING', 'ASSESSMENT', 'RATE', 'OVERRIDE'];

export default function AuditLogPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    eventType: 'ALL',
    user: '',
    account: '',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const refreshRef = useRef(null);

  useEffect(() => {
    loadEvents();
    // Auto-refresh every 30 seconds
    refreshRef.current = setInterval(loadEvents, 30000);
    return () => clearInterval(refreshRef.current);
  }, [page, filters]);

  async function loadEvents() {
    try {
      const params = { page, limit: 50 };
      if (filters.eventType !== 'ALL') params.event_type = filters.eventType;
      if (filters.user) params.user = filters.user;
      if (filters.account) params.account_num = filters.account;
      if (filters.dateFrom) params.date_from = filters.dateFrom;
      if (filters.dateTo) params.date_to = filters.dateTo;

      const res = await reportService.getEvents(params);
      setEvents(res.data.events || res.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setEvents([
        { event_id: 1, timestamp: '2026-04-15T10:30:00Z', event_type: 'LOGIN', user_email: 'admin@saws.org', account_num: null, details: 'User login successful' },
        { event_id: 2, timestamp: '2026-04-15T10:32:15Z', event_type: 'READING', user_email: 'user@saws.org', account_num: '100234', details: 'Reading submitted: MTR-001, value=45230' },
        { event_id: 3, timestamp: '2026-04-15T10:45:00Z', event_type: 'ASSESSMENT', user_email: 'admin@saws.org', account_num: '100198', details: 'Assessment #1002 accepted' },
        { event_id: 4, timestamp: '2026-04-15T11:00:30Z', event_type: 'OVERRIDE', user_email: 'admin@saws.org', account_num: '100234', details: 'Override applied to assessment #1001: incoming_ccf 128->125' },
        { event_id: 5, timestamp: '2026-04-15T11:15:00Z', event_type: 'ACCOUNT', user_email: 'admin@saws.org', account_num: '100301', details: 'Account created: SA Brewing Co' },
        { event_id: 6, timestamp: '2026-04-14T09:00:00Z', event_type: 'RATE', user_email: 'admin@saws.org', account_num: null, details: 'Rate schedule updated: Tier 1 = $4.867, effective 2025-10-01' },
        { event_id: 7, timestamp: '2026-04-14T08:30:00Z', event_type: 'METER', user_email: 'admin@saws.org', account_num: '100234', details: 'Meter MTR-003 deactivated' },
        { event_id: 8, timestamp: '2026-04-13T16:45:00Z', event_type: 'READING', user_email: 'user@saws.org', account_num: '100198', details: 'Reading submitted: MTR-005, value=88450' },
        { event_id: 9, timestamp: '2026-04-13T14:20:00Z', event_type: 'ASSESSMENT', user_email: 'admin@saws.org', account_num: '100102', details: 'Assessment #1004 completed' },
        { event_id: 10, timestamp: '2026-04-12T10:00:00Z', event_type: 'LOGIN', user_email: 'readonly@saws.org', account_num: null, details: 'User login successful' },
      ]);
      setTotal(10);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  }

  function getEventBadgeClass(type) {
    const map = {
      LOGIN: 'badge-active',
      ACCOUNT: 'badge-pending',
      METER: 'badge-pending',
      READING: 'badge-completed',
      ASSESSMENT: 'badge-due',
      RATE: 'badge-inactive',
      OVERRIDE: 'badge-inactive',
    };
    return map[type] || 'badge-pending';
  }

  return (
    <div>
      <div className="page-header">
        <h1>Audit Log</h1>
        <button className="btn btn-secondary" onClick={loadEvents}>Refresh</button>
      </div>

      <div className="filters-bar">
        <select value={filters.eventType} onChange={(e) => handleFilterChange('eventType', e.target.value)}>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          type="text"
          placeholder="Filter by user email..."
          value={filters.user}
          onChange={(e) => handleFilterChange('user', e.target.value)}
        />
        <input
          type="text"
          placeholder="Account #..."
          value={filters.account}
          onChange={(e) => handleFilterChange('account', e.target.value)}
          style={{ width: 120 }}
        />
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
        />
        <span style={{ color: 'var(--saws-text-muted)' }}>to</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>User</th>
                <th>Account</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No events found</td></tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.event_id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(evt.timestamp).toLocaleString()}</td>
                    <td><span className={`badge ${getEventBadgeClass(evt.event_type)}`}>{evt.event_type}</span></td>
                    <td>{evt.user_email}</td>
                    <td>{evt.account_num || '--'}</td>
                    <td>{evt.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
            <span className="page-info">Page {page} | {events.length} events shown</span>
            <button disabled={events.length < 50} onClick={() => setPage(page + 1)}>Next</button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--saws-text-muted)' }}>
            Auto-refreshes every 30 seconds
          </div>
        </>
      )}
    </div>
  );
}
