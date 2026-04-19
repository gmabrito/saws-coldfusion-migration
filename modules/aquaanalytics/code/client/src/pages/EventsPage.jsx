import { useState, useEffect } from 'react';
import axios from 'axios';

// Build mock event analytics data for last 14 days
function buildMockData() {
  const types = [
    'api.request',
    'aquadocs.document.search',
    'aquadocs.chat.query',
    'aquarecords.request.submitted',
    'hawk.platform.health_checked',
  ];
  const rows = [];
  for (let d = 0; d < 14; d++) {
    const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    types.forEach((t) => {
      const base = t === 'api.request' ? 80 : t.includes('search') ? 20 : 8;
      rows.push({
        event_date: date,
        event_type: t,
        event_count: Math.max(0, base + Math.floor((Math.random() - 0.4) * base)),
      });
    });
  }
  return rows;
}

// Aggregate by event_type for summary row
function summarize(rows) {
  const map = {};
  rows.forEach((r) => {
    if (!map[r.event_type]) map[r.event_type] = { today: 0, this_week: 0, total: 0 };
    const daysAgo = Math.round((Date.now() - new Date(r.event_date)) / 86400000);
    if (daysAgo === 0) map[r.event_type].today += r.event_count;
    if (daysAgo <= 7)  map[r.event_type].this_week += r.event_count;
    map[r.event_type].total += r.event_count;
  });
  return Object.entries(map).map(([type, stats]) => ({ event_type: type, ...stats }));
}

function trendBar(rows, type) {
  const last7 = [];
  for (let d = 6; d >= 0; d--) {
    const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    const row = rows.find((r) => r.event_date === date && r.event_type === type);
    last7.push(row?.event_count || 0);
  }
  const max = Math.max(...last7, 1);
  const chars = ' ▁▂▃▄▅▆▇█';
  return last7.map((v) => chars[Math.round((v / max) * (chars.length - 1))]).join('');
}

export default function EventsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStub, setIsStub] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    axios.get('/api/internal/analytics/events')
      .then((res) => {
        setRows(res.data.events || []);
        setIsStub(!!res.data._stub);
      })
      .catch(() => {
        setRows(buildMockData());
        setIsStub(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const summary = summarize(rows);
  const filtered = typeFilter ? summary.filter((s) => s.event_type === typeFilter) : summary;
  const allTypes = [...new Set(rows.map((r) => r.event_type))].sort();

  if (loading) return <div className="loading">Loading event analytics...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Event Analytics</h1>
        <span style={{ fontSize: 12, color: 'var(--saws-text-muted)' }}>Cross-module · Last 30 days{isStub && ' · mock data'}</span>
      </div>

      {isStub && (
        <div className="alert alert-info">Showing mock data — DB cross-schema queries require schemas to be provisioned.</div>
      )}

      <div className="filters-bar">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Event Types</option>
          {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {typeFilter && (
          <button className="btn btn-secondary btn-sm" onClick={() => setTypeFilter('')}>Clear</button>
        )}
      </div>

      <div className="card">
        <div className="card-header">Event Summary by Type</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Event Type</th>
              <th>Today</th>
              <th>This Week</th>
              <th>30-Day Total</th>
              <th>7-Day Trend</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">No events found.</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.event_type}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.event_type}</span></td>
                  <td><strong>{s.today}</strong></td>
                  <td>{s.this_week}</td>
                  <td style={{ color: 'var(--saws-text-muted)' }}>{s.total}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--saws-green)' }}>
                      {trendBar(rows, s.event_type)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
