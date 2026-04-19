import { useState, useEffect } from 'react';
import axios from 'axios';

// Build ASCII sparkline from an array of numbers
function sparkline(values, width = 20) {
  if (!values || values.length === 0) return '—';
  const max = Math.max(...values, 1);
  const chars = ' ▁▂▃▄▅▆▇█';
  return values
    .slice(-width)
    .map((v) => chars[Math.round((v / max) * (chars.length - 1))])
    .join('');
}

const MOCK_USAGE = Array.from({ length: 14 }, (_, i) => ({
  usage_date: new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10),
  request_count: 0,
  total_tokens: 0,
  avg_duration_ms: null,
}));

const MOCK_BY_MODULE = [
  { calling_module: 'aquadocs',    request_count: 0, total_tokens: 0, avg_duration_ms: null },
  { calling_module: 'aquarecords', request_count: 0, total_tokens: 0, avg_duration_ms: null },
];

export default function UsagePage() {
  const [usage, setUsage] = useState([]);
  const [byModule, setByModule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isStub, setIsStub] = useState(false);
  const [azureConfigured, setAzureConfigured] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      axios.get('/api/internal/usage'),
      axios.get('/api/internal/usage/by-module'),
      axios.get('/api/internal/models'),
    ]).then(([usageRes, byModRes, modelsRes]) => {
      if (usageRes.status === 'fulfilled') {
        setUsage(usageRes.value.data.usage || []);
        setIsStub(!!usageRes.value.data._stub);
      } else {
        setUsage(MOCK_USAGE);
        setIsStub(true);
      }
      if (byModRes.status === 'fulfilled') {
        setByModule(byModRes.value.data.byModule || []);
      } else {
        setByModule(MOCK_BY_MODULE);
      }
      if (modelsRes.status === 'fulfilled') {
        setAzureConfigured(modelsRes.value.data.azureConfigured || false);
      }
    }).finally(() => setLoading(false));
  }, []);

  const today = usage[0];
  const last7 = usage.slice(0, 7);
  const totalReqs7d = last7.reduce((s, r) => s + (r.request_count || 0), 0);
  const totalTokens7d = last7.reduce((s, r) => s + (r.total_tokens || 0), 0);
  const sparkValues = [...usage].reverse().map((r) => r.request_count || 0);

  if (loading) return <div className="loading">Loading usage data...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>AI Usage Dashboard</h1>
        {!azureConfigured && (
          <span className="badge badge-not-configured">Azure OpenAI Not Configured</span>
        )}
      </div>

      {!azureConfigured && (
        <div className="alert alert-warning">
          Azure OpenAI is not configured in this PoC environment. All completions and embeddings return stub responses.
          Set <code>AZURE_OPENAI_ENDPOINT</code> and <code>AZURE_OPENAI_KEY</code> in the server <code>.env</code> to activate.
        </div>
      )}

      {isStub && azureConfigured && (
        <div className="alert alert-info">Showing mock data — database not yet provisioned.</div>
      )}

      <div className="dashboard-cards">
        <div className="stat-card green">
          <div className="stat-value">{today?.request_count || 0}</div>
          <div className="stat-label">Requests Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{(today?.total_tokens || 0).toLocaleString()}</div>
          <div className="stat-label">Tokens Today</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-value">{totalReqs7d}</div>
          <div className="stat-label">Requests (Last 7d)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalTokens7d.toLocaleString()}</div>
          <div className="stat-label">Tokens (Last 7d)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Daily usage table with sparkline */}
        <div className="card">
          <div className="card-header">
            Daily Usage (Last 14 Days)
            <span style={{ marginLeft: 16, fontFamily: 'monospace', fontSize: 13, color: 'var(--saws-green)', fontWeight: 400 }}>
              {sparkline(sparkValues)}
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Requests</th>
                <th>Tokens</th>
                <th>Avg Latency</th>
              </tr>
            </thead>
            <tbody>
              {usage.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No usage data yet.</td></tr>
              ) : (
                usage.map((row) => (
                  <tr key={row.usage_date}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.usage_date}</td>
                    <td><strong>{row.request_count}</strong></td>
                    <td>{(row.total_tokens || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--saws-text-muted)' }}>
                      {row.avg_duration_ms ? `${row.avg_duration_ms}ms` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* By module */}
        <div className="card">
          <div className="card-header">Usage by Module (30d)</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Requests</th>
                <th>Tokens</th>
              </tr>
            </thead>
            <tbody>
              {byModule.length === 0 ? (
                <tr><td colSpan={3} className="empty-state">No data.</td></tr>
              ) : (
                byModule.map((row) => (
                  <tr key={row.calling_module}>
                    <td><code style={{ fontSize: 12 }}>{row.calling_module}</code></td>
                    <td><strong>{row.request_count}</strong></td>
                    <td>{(row.total_tokens || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
