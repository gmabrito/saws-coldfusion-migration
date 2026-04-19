import { useState, useEffect } from 'react';
import axios from 'axios';

const MOCK_STATS = {
  period: '7d',
  modules: {
    aquadocs:     { docSearches: 87, chatQueries: 34, totalEvents: 312, uniqueUsers: 12 },
    aquarecords:  { totalEvents: 45, uniqueUsers: 8 },
    aquaai:       { totalEvents: 0, note: 'Schema not yet provisioned' },
    aquahawk:     { totalEvents: 0, note: 'Schema not yet provisioned' },
  },
  _stub: true,
};

const MODULE_CONFIG = {
  aquadocs:     { icon: '📄', name: 'AquaDocs',      color: '#0078AE' },
  aquarecords:  { icon: '📋', name: 'AquaRecords',   color: '#005A87' },
  aquaai:       { icon: '🤖', name: 'AquaAI',        color: '#00A344' },
  aquahawk:     { icon: '🦅', name: 'AquaHawk',      color: '#D32F2F' },
};

export default function ModulesPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/internal/analytics/modules')
      .then((res) => setData(res.data))
      .catch(() => setData(MOCK_STATS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading module analytics...</div>;

  const modules = data?.modules || MOCK_STATS.modules;
  const isStub = data?._stub || false;

  return (
    <div>
      <div className="page-header">
        <h1>Per-Module Usage</h1>
        <span style={{ fontSize: 12, color: 'var(--saws-text-muted)' }}>
          Last {data?.period || '7d'}{isStub && ' · mock data'}
        </span>
      </div>

      {isStub && (
        <div className="alert alert-info">Showing mock data — DB schemas not yet provisioned.</div>
      )}

      {/* AquaDocs */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>📄</span> AquaDocs — Document AI
        </div>
        <div className="dashboard-cards" style={{ marginBottom: 0 }}>
          <div className="stat-card green">
            <div className="stat-value">{modules.aquadocs?.docSearches ?? '—'}</div>
            <div className="stat-label">Document Searches</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{modules.aquadocs?.chatQueries ?? '—'}</div>
            <div className="stat-label">AI Chat Queries</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-value">{modules.aquadocs?.totalEvents ?? '—'}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{modules.aquadocs?.uniqueUsers ?? '—'}</div>
            <div className="stat-label">Unique Users</div>
          </div>
        </div>
      </div>

      {/* AquaRecords */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>📋</span> AquaRecords — Open Records
        </div>
        <div className="dashboard-cards" style={{ marginBottom: 0 }}>
          <div className="stat-card">
            <div className="stat-value">{modules.aquarecords?.totalEvents ?? '—'}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card green">
            <div className="stat-value">{modules.aquarecords?.uniqueUsers ?? '—'}</div>
            <div className="stat-label">Unique Users</div>
          </div>
        </div>
      </div>

      {/* AquaAI */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🤖</span> AquaAI — Shared AI Services
        </div>
        {modules.aquaai?.note ? (
          <div className="alert alert-warning" style={{ marginBottom: 0 }}>
            {modules.aquaai.note} — Deploy AquaAI and run its schema to see usage data here.
          </div>
        ) : (
          <div className="dashboard-cards" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-value">{modules.aquaai?.totalEvents ?? 0}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>
        )}
      </div>

      {/* AquaHawk */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>🦅</span> AquaHawk — Platform Operations
        </div>
        {modules.aquahawk?.note ? (
          <div className="alert alert-warning" style={{ marginBottom: 0 }}>
            {modules.aquahawk.note} — Deploy AquaHawk and run its schema to see dashboard views here.
          </div>
        ) : (
          <div className="dashboard-cards" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-value">{modules.aquahawk?.totalEvents ?? 0}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
