import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/internal/admin/config')
      .then((res) => setConfig(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading configuration...</div>;
  if (error) return <div className="alert alert-danger">Failed to load config: {error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Platform Configuration</h1>
        <span className="badge badge-ok">Admin</span>
      </div>

      <div className="alert alert-info">
        This view is read-only during PoC. Configuration is managed via environment variables on the server.
      </div>

      <div className="card">
        <div className="card-header">Module Identity</div>
        <table className="data-table">
          <tbody>
            <tr><td style={{ width: 220, fontWeight: 600 }}>Module</td><td>{config.module}</td></tr>
            <tr><td style={{ fontWeight: 600 }}>Version</td><td>{config.version}</td></tr>
            <tr><td style={{ fontWeight: 600 }}>Environment</td><td><code>{config.environment}</code></td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">Module Dependencies</div>
        <table className="data-table">
          <tbody>
            <tr>
              <td style={{ width: 220, fontWeight: 600 }}>AquaDocs API URL</td>
              <td><code>{config.aquadocsApiUrl}</code></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>AquaRecords API URL</td>
              <td><code>{config.aquarecordsApiUrl}</code></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Eventhouse URL</td>
              <td>
                {config.eventhouseUrl
                  ? <code>{config.eventhouseUrl}</code>
                  : <span style={{ color: 'var(--saws-text-muted)' }}>Not configured (PoC)</span>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">AD Groups (Post-PoC)</div>
        <table className="data-table">
          <thead>
            <tr><th>Role</th><th>AD Group</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Admin</td>
              <td><code>{config.adGroups?.admin}</code></td>
              <td><span className="badge badge-pending">Pending Provisioning</span></td>
            </tr>
            <tr>
              <td>Viewer</td>
              <td><code>{config.adGroups?.viewer}</code></td>
              <td><span className="badge badge-pending">Pending Provisioning</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
