import { useState, useEffect } from 'react';
import axios from 'axios';

// PoC suite — AquaCore + Portal + 6 ColdFusion migration targets
const MOCK_MODULES = [
  // AquaCore Intelligence Layer
  { id: 'aquadocs',           name: 'AquaDocs',           desc: 'Document AI & Knowledge Base',              icon: '📄', status: 'ok',      port: 3030, category: 'AquaCore' },
  { id: 'aquarecords',        name: 'AquaRecords',        desc: 'Open Records Request Management',            icon: '📋', status: 'ok',      port: 3031, category: 'AquaCore' },
  { id: 'aquahawk',           name: 'AquaHawk',           desc: 'Platform Operations Dashboard',              icon: '🦅', status: 'ok',      port: 3032, category: 'AquaCore' },
  { id: 'aquaai',             name: 'AquaAI',             desc: 'Shared AI Services Layer',                   icon: '🤖', status: 'unknown', port: 3033, category: 'AquaCore' },
  // Portal
  { id: 'portal',             name: 'EZ Link Portal',     desc: 'SAWS intranet portal',                       icon: '🏠', status: 'ok',      port: 3000, category: 'Portal'   },
  // ColdFusion Migration — Internal
  { id: 'flat-rate-sewer',    name: 'Flat Rate Sewer',    desc: 'Private-well sewer billing',                 icon: '🔧', status: 'unknown', port: 3020, category: 'Internal' },
  { id: 'utility-maps',       name: 'Utility Maps',       desc: 'As-built PDF map viewer',                    icon: '🗺️', status: 'unknown', port: 3013, category: 'Internal' },
  { id: 'sitrep',             name: 'SITREP',             desc: 'EOC emergency logging & notifications',       icon: '🚨', status: 'unknown', port: 3040, category: 'Internal' },
  { id: 'take-home-vehicles', name: 'Take Home Vehicles', desc: 'Fleet vehicle overnight checkout',            icon: '🚛', status: 'unknown', port: 3041, category: 'Internal' },
  // ColdFusion Migration — External
  { id: 'fhm',                name: 'Fire Hydrant Meter', desc: 'Customer hydrant meter usage & billing',      icon: '💧', status: 'unknown', port: 3001, category: 'External' },
  { id: 'locates',            name: 'Locates',            desc: 'Public dig-safe locate request submission',   icon: '📍', status: 'unknown', port: 3042, category: 'External' },
];

const MOCK_EVENTS = [
  { event_type: 'aquadocs.document.search',     user_id: 'jsmith@saws.org',    created_at: '2026-04-19T14:32:00Z', payload: '{"query":"pump maintenance SOP"}' },
  { event_type: 'hawk.platform.health_checked', user_id: 'system',             created_at: '2026-04-19T14:30:00Z', payload: '{"overall":"ok"}' },
  { event_type: 'aquadocs.chat.query',          user_id: 'mjones@saws.org',    created_at: '2026-04-19T14:28:00Z', payload: '{"query":"chlorine dosing procedure"}' },
  { event_type: 'api.request',                  user_id: 'bwilliams@saws.org', created_at: '2026-04-19T14:25:00Z', payload: '{"method":"GET","status":200}' },
  { event_type: 'aquadocs.document.search',     user_id: 'demo@saws.org',      created_at: '2026-04-19T14:20:00Z', payload: '{"query":"water main break procedure"}' },
];

function StatusBadge({ status }) {
  const map = { ok: ['badge-ok', 'Online'], offline: ['badge-offline', 'Offline'], error: ['badge-error', 'Error'], degraded: ['badge-degraded', 'Degraded'], unknown: ['badge-unknown', 'Unknown'] };
  const [cls, label] = map[status] || map.unknown;
  return <span className={`badge ${cls}`}>{label}</span>;
}

function relativeTime(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}

export default function DashboardPage() {
  const [health, setHealth] = useState(null);
  const [events, setEvents] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  async function load() {
    try {
      const [healthRes, eventsRes, statsRes] = await Promise.allSettled([
        axios.get('/api/internal/platform/health'),
        axios.get('/api/internal/platform/events'),
        axios.get('/api/internal/platform/stats'),
      ]);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data.events);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.stats);
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      // Use mock data on failure
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const modules = health
    ? MOCK_MODULES.map((m) => {
        const live = health.modules?.[m.id];
        return { ...m, status: live?.status || m.status };
      })
    : MOCK_MODULES;

  const displayEvents = events || MOCK_EVENTS;
  const displayStats = stats || [
    { event_type: 'api.request',             last_24h: 147, last_7d: 892 },
    { event_type: 'aquadocs.document.search', last_24h: 38,  last_7d: 224 },
    { event_type: 'aquadocs.chat.query',      last_24h: 21,  last_7d: 130 },
    { event_type: 'hawk.platform.health_checked', last_24h: 18, last_7d: 112 },
  ];

  const totalEvents24h = displayStats.reduce((s, r) => s + (r.last_24h || 0), 0);
  const onlineCount = modules.filter((m) => m.status === 'ok').length;

  if (loading) return <div className="loading">Loading platform status...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Platform Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastChecked && <span style={{ fontSize: 12, color: 'var(--saws-text-muted)' }}>Last checked: {lastChecked}</span>}
          <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="dashboard-cards">
        <div className="stat-card green">
          <div className="stat-value">{onlineCount}/{modules.length}</div>
          <div className="stat-label">Modules Online</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalEvents24h}</div>
          <div className="stat-label">Events (Last 24h)</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{displayStats.find(s => s.event_type === 'aquadocs.document.search')?.last_24h || 38}</div>
          <div className="stat-label">Doc Searches Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{displayStats.find(s => s.event_type === 'aquadocs.chat.query')?.last_24h || 21}</div>
          <div className="stat-label">AI Chat Queries Today</div>
        </div>
      </div>

      {/* Module health tiles */}
      <div className="card-header" style={{ marginBottom: 12, fontSize: 16, fontWeight: 600, color: 'var(--saws-navy)' }}>
        Module Health
      </div>
      <div className="module-tiles" style={{ marginBottom: 24 }}>
        {modules.map((mod) => (
          <div key={mod.id} className={`module-tile status-${mod.status}`}>
            <div className="module-icon">{mod.icon}</div>
            <div className="module-info">
              <div className="module-name">{mod.name}</div>
              <div className="module-desc">{mod.desc}</div>
              <div className="module-status">
                <StatusBadge status={mod.status} />
                <span style={{ fontSize: 11, color: 'var(--saws-text-muted)', marginLeft: 8 }}>:{mod.port}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent events */}
        <div className="card">
          <div className="card-header">Recent Events</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>User</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {displayEvents.slice(0, 8).map((e, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.event_type}</span>
                  </td>
                  <td style={{ color: 'var(--saws-text-muted)', fontSize: 12 }}>
                    {e.user_id ? e.user_id.split('@')[0] : '—'}
                  </td>
                  <td style={{ color: 'var(--saws-text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {relativeTime(e.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Platform stats */}
        <div className="card">
          <div className="card-header">Platform Stats (Last 24h / 7d)</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>24h</th>
                <th>7d</th>
              </tr>
            </thead>
            <tbody>
              {displayStats.map((s, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.event_type}</span>
                  </td>
                  <td><strong>{s.last_24h}</strong></td>
                  <td style={{ color: 'var(--saws-text-muted)' }}>{s.last_7d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
