import { ThemeToggle } from '@saws/ui-shell';

// ── PoC App Registry ─────────────────────────────────────────────────────────
// All 10 apps in the suite. Client ports are the Vite dev server ports.
// In production these become the Container Apps / Static Web App URLs.
const APPS = [
  // AquaCore Intelligence Layer
  {
    id: 'aquadocs',
    name: 'AquaDocs',
    icon: '📄',
    desc: 'Document AI & Knowledge Base — semantic search, RAG chat, voice Q&A. Pilot: 146 SAWS documents.',
    port: 3130,
    category: 'aquacore',
  },
  {
    id: 'aquarecords',
    name: 'AquaRecords',
    icon: '📋',
    desc: 'Open Records Request Management — TPIA/§552 intake, SLA tracking, exemption management.',
    port: 3131,
    category: 'aquacore',
  },
  {
    id: 'aquahawk',
    name: 'AquaHawk',
    icon: '🦅',
    desc: 'Platform Operations Dashboard — health monitoring, event log, Azure cost tracking across the full suite.',
    port: 3132,
    category: 'aquacore',
  },
  {
    id: 'aquaai',
    name: 'AquaAI',
    icon: '🤖',
    desc: 'Shared AI Services Layer — centralized Azure OpenAI proxy with per-module usage tracking and budget monitoring.',
    port: 3133,
    category: 'aquacore',
  },

  // ColdFusion Migration — Internal (SAWS staff only)
  {
    id: 'flat-rate-sewer',
    name: 'Flat Rate Sewer',
    icon: '🔧',
    desc: 'Mini billing app for private-well customers — account management, meter tracking, annual assessments, audit log.',
    port: 3120,
    category: 'internal',
  },
  {
    id: 'utility-maps',
    name: 'Utility Maps',
    icon: '🗺️',
    desc: 'As-built PDF viewer with metadata search — 50-doc pilot. Strong candidate to merge into AquaDocs.',
    port: 3113,
    category: 'internal',
  },
  {
    id: 'sitrep',
    name: 'SITREP',
    icon: '🚨',
    desc: 'EOC situational reporting — log emergencies at SAWS facilities, trigger email notifications, track response actions.',
    port: 3140,
    category: 'internal',
  },
  {
    id: 'take-home-vehicles',
    name: 'Take Home Vehicles',
    icon: '🚛',
    desc: 'Fleet overnight vehicle checkout — employees request, managers approve, mileage and fuel logged on return.',
    port: 3141,
    category: 'internal',
  },

  // ColdFusion Migration — External (public / contractor-facing)
  {
    id: 'fhm',
    name: 'Fire Hydrant Meter',
    icon: '💧',
    desc: 'Customer billing app — contractors log hydrant meter consumption; integrates with Infor. Finance admin view included.',
    port: 3100,
    category: 'external',
  },
  {
    id: 'locates',
    name: 'Locates',
    icon: '📍',
    desc: 'Public dig-safe request portal — anyone digging near SAWS infrastructure submits a locate; operations team reviews.',
    port: 3142,
    category: 'external',
  },
];

const SECTIONS = [
  {
    key: 'aquacore',
    label: 'AquaCore Intelligence Layer',
    note: '4 Azure-backed modules',
    accent: 'var(--saws-blue)',
  },
  {
    key: 'internal',
    label: 'ColdFusion Migration — Internal Apps',
    note: 'SAWS staff · 4 modules',
    accent: '#2d6a4f',
  },
  {
    key: 'external',
    label: 'ColdFusion Migration — External Apps',
    note: 'Public / contractor-facing · 2 modules',
    accent: '#6b3fa0',
  },
];

export default function App() {
  return (
    <div className="launcher">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="launcher-header">
        <div className="launcher-brand">
          <div className="launcher-logo">SAWS</div>
          <div>
            <div className="launcher-title">AquaCore PoC Suite</div>
            <div className="launcher-subtitle">San Antonio Water System — Application Launcher</div>
          </div>
        </div>
        <div className="launcher-right">
          <span className="poc-badge">PoC · Local Dev</span>
          <ThemeToggle />
        </div>
      </header>

      {/* ── App sections ─────────────────────────────────────────────── */}
      <main className="launcher-main">
        {SECTIONS.map(({ key, label, note, accent }) => {
          const apps = APPS.filter((a) => a.category === key);
          return (
            <section key={key} className="app-section">
              <div className="section-heading">
                <span className="section-accent" style={{ background: accent }} />
                <span className="section-label">{label}</span>
                <span className="section-note">{note}</span>
              </div>
              <div className="app-grid">
                {apps.map((app) => (
                  <a
                    key={app.id}
                    href={`http://localhost:${app.port}`}
                    className={`app-tile app-tile-${key}`}
                  >
                    <div className="app-icon">{app.icon}</div>
                    <div className="app-info">
                      <div className="app-name">{app.name}</div>
                      <div className="app-desc">{app.desc}</div>
                    </div>
                    <div className="app-port">:{app.port}</div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="launcher-footer">
        AquaCore PoC · SAWS IS Digital · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
