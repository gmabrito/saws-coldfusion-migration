import { useState, useEffect } from 'react';
import axios from 'axios';

// PoC suite — AquaCore + Portal + 6 ColdFusion migration targets
const MODULE_META = {
  // AquaCore Intelligence Layer
  aquadocs:           { icon: '📄', category: 'AquaCore', description: 'Document AI & Knowledge Base — AI-powered search, RAG chat, voice Q&A. Pilot corpus: 146 SAWS documents.' },
  aquarecords:        { icon: '📋', category: 'AquaCore', description: 'Open Records Request Management — TPIA/open-records intake, SLA tracking, and Texas §552 exemption management.' },
  aquahawk:           { icon: '🦅', category: 'AquaCore', description: 'Platform Operations Dashboard — health, events, costs, and module registry across the full PoC suite.' },
  aquaai:             { icon: '🤖', category: 'AquaCore', description: 'Shared AI Services Layer — centralized Azure OpenAI proxy with per-module usage tracking and budget monitoring.' },
  // Portal
  portal:             { icon: '🏠', category: 'Portal',   description: 'EZ Link Portal — SAWS intranet home page; entry point to all internal applications.' },
  // Internal migration targets
  'flat-rate-sewer':  { icon: '🔧', category: 'Internal', description: 'Flat Rate Sewer — Mini billing app for private-well customers. Manages accounts, meters, annual assessments, and audit log.' },
  'utility-maps':     { icon: '🗺️', category: 'Internal', description: 'Utility Maps — As-built PDF viewer with metadata search. 50-doc pilot. Strong candidate to become an AquaDocs collection.' },
  sitrep:             { icon: '🚨', category: 'Internal', description: 'SITREP — EOC situational reporting app. Logs emergencies at SAWS facilities, triggers email notifications, tracks response actions.' },
  'take-home-vehicles':{ icon: '🚛', category: 'Internal', description: 'Take Home Vehicles — Fleet overnight vehicle checkout. Employees request; managers approve; mileage/fuel logged on return.' },
  // External migration targets
  fhm:                { icon: '💧', category: 'External', description: 'Fire Hydrant Meter — Customer-facing billing app. Contractors log hydrant meter consumption; integrates with Infor for billing.' },
  locates:            { icon: '📍', category: 'External', description: 'Locates — Public dig-safe request portal. Anyone digging near SAWS infrastructure submits a locate request; operations team reviews.' },
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
        // Fallback — registry with unknown status (server unreachable)
        setModules(Object.entries(MODULE_META).map(([id, meta]) => ({
          id,
          name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          version: '1.0.0',
          status: ['aquadocs','aquarecords','aquahawk','aquaai','portal'].includes(id) ? 'ok' : 'unknown',
          category: meta.category,
        })));
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
