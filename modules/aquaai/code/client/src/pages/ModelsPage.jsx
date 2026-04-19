import { useState, useEffect } from 'react';
import axios from 'axios';

function StatusBadge({ status }) {
  const map = {
    available:      ['badge-available',      'Available'],
    'not-configured': ['badge-not-configured', 'Not Configured'],
    error:          ['badge-error',          'Error'],
    unknown:        ['badge-unknown',        'Unknown'],
  };
  const [cls, label] = map[status] || map.unknown;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function ModelsPage() {
  const [models, setModels] = useState([]);
  const [azureConfigured, setAzureConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/internal/models')
      .then((res) => {
        setModels(res.data.models || []);
        setAzureConfigured(res.data.azureConfigured || false);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading models...</div>;
  if (error) return <div className="alert alert-danger">Failed to load models: {error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Registered AI Models</h1>
        {azureConfigured
          ? <span className="badge badge-available">Azure OpenAI Connected</span>
          : <span className="badge badge-not-configured">Azure OpenAI Not Configured</span>}
      </div>

      {!azureConfigured && (
        <div className="alert alert-warning">
          Azure OpenAI is not configured. Models are registered but inactive.
          Configure <code>AZURE_OPENAI_ENDPOINT</code> and <code>AZURE_OPENAI_KEY</code> to activate.
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {models.map((model) => (
          <div key={model.id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--saws-navy)' }}>{model.id}</span>
                  <StatusBadge status={model.status} />
                  <span className="badge" style={{ background: '#e9ecef', color: '#495057' }}>{model.type}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--saws-text-muted)', marginBottom: 12 }}>{model.description}</p>
                <table style={{ fontSize: 12, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ paddingRight: 24, color: 'var(--saws-text-muted)', paddingBottom: 4 }}>Deployment</td>
                      <td><code>{model.deployment}</code></td>
                    </tr>
                    {model.maxTokens && (
                      <tr>
                        <td style={{ paddingRight: 24, color: 'var(--saws-text-muted)', paddingBottom: 4 }}>Context Window</td>
                        <td>{model.maxTokens.toLocaleString()} tokens</td>
                      </tr>
                    )}
                    {model.dimensions && (
                      <tr>
                        <td style={{ paddingRight: 24, color: 'var(--saws-text-muted)', paddingBottom: 4 }}>Dimensions</td>
                        <td>{model.dimensions.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ paddingRight: 24, color: 'var(--saws-text-muted)' }}>Latency P50</td>
                      <td>{model.latencyP50Ms ? `${model.latencyP50Ms}ms` : <em style={{ color: 'var(--saws-text-muted)' }}>No data yet</em>}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">How AquaAI Works</div>
        <p style={{ fontSize: 13, color: 'var(--saws-text-muted)', lineHeight: 1.7 }}>
          AquaAI acts as a centralized proxy for all Azure OpenAI calls across AquaCore modules.
          Instead of each module holding its own Azure credentials, they call
          <code style={{ margin: '0 4px', background: '#f5f7fa', padding: '1px 4px', borderRadius: 3 }}>POST /api/internal/completions</code>
          or
          <code style={{ margin: '0 4px', background: '#f5f7fa', padding: '1px 4px', borderRadius: 3 }}>POST /api/internal/embeddings</code>
          on this server. Every call is logged to <code>aquaai.usage_log</code> for cost attribution and budget tracking.
          During PoC, all routes return stub responses until <code>AZURE_OPENAI_ENDPOINT</code> is provisioned.
        </p>
      </div>
    </div>
  );
}
