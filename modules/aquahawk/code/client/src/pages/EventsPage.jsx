import { useState, useEffect } from 'react';
import axios from 'axios';

const MOCK_EVENTS = Array.from({ length: 30 }, (_, i) => {
  const types = [
    'api.request', 'aquadocs.document.search', 'aquadocs.chat.query',
    'hawk.platform.health_checked', 'hawk.module.status_changed',
    'user.access_denied', 'hawk.stats.queried', 'hawk.events.queried',
  ];
  const users = ['jsmith@saws.org', 'mjones@saws.org', 'bwilliams@saws.org', 'demo@saws.org', null];
  return {
    event_id: `mock-${i + 1}`,
    event_type: types[i % types.length],
    user_id: users[i % users.length],
    payload: JSON.stringify({ index: i, mock: true }),
    created_at: new Date(Date.now() - i * 7 * 60 * 1000).toISOString(),
  };
});

const ALL_TYPES = [...new Set(MOCK_EVENTS.map((e) => e.event_type))].sort();

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [isStub, setIsStub] = useState(false);

  useEffect(() => {
    axios.get('/api/internal/platform/events')
      .then((res) => {
        setEvents(res.data.events || []);
        setIsStub(!!res.data._stub);
      })
      .catch(() => {
        setEvents(MOCK_EVENTS);
        setIsStub(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter((e) => {
    if (typeFilter && e.event_type !== typeFilter) return false;
    if (userFilter && !(e.user_id || '').toLowerCase().includes(userFilter.toLowerCase())) return false;
    return true;
  });

  const uniqueTypes = [...new Set(events.map((e) => e.event_type))].sort();

  function fmt(iso) {
    return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Event Feed</h1>
        <span style={{ fontSize: 13, color: 'var(--saws-text-muted)' }}>{filtered.length} events</span>
      </div>

      {isStub && (
        <div className="alert alert-info">Showing mock data — database not yet provisioned.</div>
      )}

      <div className="filters-bar">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Event Types</option>
          {uniqueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          type="text"
          placeholder="Filter by user..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          style={{ minWidth: 200 }}
        />
        {(typeFilter || userFilter) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setTypeFilter(''); setUserFilter(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Event Type</th>
            <th>User</th>
            <th>Payload Preview</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={4} className="empty-state">No events match the current filters.</td></tr>
          ) : (
            filtered.map((e) => (
              <tr key={e.event_id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {fmt(e.created_at)}
                </td>
                <td>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.event_type}</span>
                </td>
                <td style={{ color: 'var(--saws-text-muted)', fontSize: 12 }}>
                  {e.user_id || <em>system</em>}
                </td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--saws-text-muted)' }}>
                  {e.payload || '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
