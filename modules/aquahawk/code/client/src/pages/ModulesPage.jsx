import { useState, useEffect } from 'react';
import axios from 'axios';

const MODULE_META = {
  aquadocs:     { icon: '📄', description: 'Document AI & Knowledge Base — AI-powered search, RAG chat, voice interface for SAWS documents.' },
  aquarecords:  { icon: '📋', description: 'Open Records Request Management — TPIA/open-records intake, tracking, and fulfillment.' },
  aquahawk:     { icon: '🦅', description: 'Platform Operations Dashboard — Aggregates health and events from all AquaCore modules.' },
  aquaai:       { icon: '🤖', description: 'Shared AI Services Layer — Centralized Azure OpenAI proxy with usage tracking by module.' },
  aquaanalytics:{ icon: '📊', description: 'Cross-Module Analytics — Platform usage trends, query volumes, and operational reporting.' },
};

function StatusBadge({ status }) {
  const map = {
    ok:      ['badge-ok',      'Online'],
    offline: ['badge-offline', 'Offline'],
    error:   ['badge-error',   'Error'],
    degraded:['badge-degraded','Degraded'],
    unknown: ['badge-unknown', 'Unknown'],
  };
  const [cls, label] = map[status] || map.unknown;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function ModulesPage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState(null);

  function load() {
    setLoading(true);
    axios.get('/api/internal/platform/modules')
      .then((res) => {
        setModules(res.data.modules || []);
        setCheckedAt(res.data.checkedAt);
      })
      .catch(() => {
        // Fallback mock
        setModules([
          { id: 'aquadocs',     name: 'AquaDocs',      version: '1.0.0', port: 3030, status: 'ok'      },
          { id: 'aquarecords',  name: 'AquaRecords',   version: '1.0.0', port: 3031, status: 'ok'      },
          { id: 'aquahawk',     name: 'AquaHawk',      version: '1.0.0', port: 3032, status: 'ok'      },
          { id: 'aquaai',       name: 'AquaAI',        version: '1.0.0', port: 3033, status: 'unknown' },
          { id: 'aquaanalytics',name: 'AquaAnalytics', version: '1.0.0', port: 3034, status: 'unknown' },
        ]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="loading">Probing module health...</div>;

  const online = modules.filter((m) => m.status === 'ok').length;

  return (
    <div>
      <div className="page-header">
        <h1>Module Registry</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--saws-text-muted)' }}>
            {online}/{modules.length} online
            {checkedAt && ` · checked ${new Date(checkedAt).toLocaleTimeString()}`}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={load}>Re-check</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {modules.map((mod) => {
          const meta = MODULE_META[mod.id] || { icon: '🔷', description: '' };
          return (
            <div key={mod.id} className={`card module-tile status-${mod.status}`} style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{ fontSize: 36, lineHeight: 1 }}>{meta.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--saws-navy)' }}>{mod.name}</span>
                  <StatusBadge status={mod.status} />
                  <span style={{ fontSize: 12, color: 'var(--saws-text-muted)' }}>v{mod.version || '1.0.0'}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--saws-text-muted)', marginBottom: 8 }}>{meta.description}</p>
                <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--saws-text-muted)' }}>
                  <span>Port: <strong>{mod.port}</strong></span>
                  <span>ID: <code style={{ background: '#f5f7fa', padding: '1px 4px', borderRadius: 3 }}>{mod.id}</code></span>
                  {mod.healthData?.timestamp && (
                    <span>Last seen: {new Date(mod.healthData.timestamp).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
