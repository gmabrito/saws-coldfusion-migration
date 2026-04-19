import { useState, useEffect } from 'react';
import axios from 'axios';

export default function CostPage() {
  const [data, setData]       = useState(null);
  const [tags, setTags]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview'); // overview | services | tags

  useEffect(() => {
    Promise.allSettled([
      axios.get('/api/internal/costs'),
      axios.get('/api/internal/costs/tags'),
    ]).then(([costsRes, tagsRes]) => {
      if (costsRes.status  === 'fulfilled') setData(costsRes.value.data);
      if (tagsRes.status   === 'fulfilled') setTags(tagsRes.value.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading cost data…</div>;
  if (!data)   return <div className="alert alert-error">Cost data unavailable</div>;

  const totalBudget  = data.mtd?.budget   ?? 0;
  const totalMTD     = data.mtd?.total    ?? 0;
  const budgetPct    = totalBudget > 0 ? Math.round((totalMTD / totalBudget) * 100) : 0;
  const budgetStatus = budgetPct >= 90 ? 'error' : budgetPct >= 75 ? 'warning' : 'ok';

  return (
    <div>
      {data._stub && (
        <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
          <strong>Estimated costs</strong> — {data._message}
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard
          label="Month-to-Date"
          value={`$${totalMTD.toFixed(2)}`}
          sub={`of $${totalBudget} budget`}
          accent={budgetStatus === 'error' ? 'var(--saws-red)' : budgetStatus === 'warning' ? 'var(--saws-orange)' : 'var(--saws-green)'}
        />
        <StatCard
          label="Projected Month-End"
          value={`$${data.forecast?.projectedMonthEnd?.toFixed(2) ?? '—'}`}
          sub={`$${data.forecast?.dailyBurn?.toFixed(2) ?? '—'}/day burn · ${data.forecast?.daysRemaining ?? '—'} days left`}
        />
        <StatCard
          label="Last Month"
          value={`$${data.lastMonth?.total?.toFixed(2) ?? '—'}`}
          sub={totalMTD < data.lastMonth?.total ? '▼ tracking below last month' : '▲ tracking above last month'}
          accent={totalMTD < data.lastMonth?.total ? 'var(--saws-green)' : 'var(--saws-orange)'}
        />
        <StatCard
          label="Year-to-Date"
          value={`$${data.ytd?.total?.toFixed(2) ?? '—'}`}
          sub={data.period ?? ''}
        />
      </div>

      {/* ── Budget utilization bar ─────────────────────────────────────── */}
      {totalBudget > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>Total Budget Utilization</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>${totalMTD.toFixed(2)} / ${totalBudget} ({budgetPct}%)</span>
          </div>
          <BudgetBar pct={budgetPct} status={budgetStatus} />
          {budgetPct >= 90 && (
            <p style={{ margin: '0.5rem 0 0', fontSize: 13, color: 'var(--saws-red)' }}>
              ⚠ At {budgetPct}% of budget — review spend before month-end.
            </p>
          )}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)', marginBottom: '1.25rem' }}>
        {[['overview','By Module'], ['services','By Service'], ['tags','Tag Strategy']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: tab === id ? 700 : 400,
              color: tab === id ? 'var(--saws-brand-blue)' : 'var(--text)',
              borderBottom: tab === id ? '2px solid var(--saws-brand-blue)' : '2px solid transparent',
              marginBottom: -2,
              fontSize: 14,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: By Module ───────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Cost by Module</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Module</th>
                <th style={{ textAlign: 'right' }}>MTD Cost</th>
                <th style={{ textAlign: 'right' }}>Budget</th>
                <th style={{ minWidth: 160 }}>Utilization</th>
                <th>Azure Resources</th>
              </tr>
            </thead>
            <tbody>
              {(data.byModule ?? []).map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {m.cost > 0 ? `$${m.cost.toFixed(2)}` : <span style={{ color: 'var(--text-muted)' }}>$0.00</span>}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {m.budget > 0 ? `$${m.budget}` : <span>—</span>}
                  </td>
                  <td>
                    {m.budget > 0
                      ? <BudgetBar pct={m.percent ?? 0} status={m.percent >= 90 ? 'error' : m.percent >= 75 ? 'warning' : 'ok'} small />
                      : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Local only</span>
                    }
                  </td>
                  <td>
                    {m.hasAzure
                      ? <span className="badge badge-ok">Active</span>
                      : <span className="badge badge-unknown">Local / None</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: '1rem', fontSize: 12, color: 'var(--text-muted)' }}>
            Migration modules (Finance, CEO, HR, etc.) run locally in the PoC and have no Azure resources — $0 spend.
            Azure costs will appear here automatically once resources are provisioned and tagged with <code>project=aquacore</code>.
          </p>
        </div>
      )}

      {/* ── Tab: By Service ──────────────────────────────────────────── */}
      {tab === 'services' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Cost by Azure Service</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Azure Service</th>
                <th>Category</th>
                <th>SKU / Tier</th>
                <th style={{ textAlign: 'right' }}>MTD Cost</th>
                <th style={{ minWidth: 140 }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {(data.byService ?? []).filter((s) => s.cost > 0 || s.sku === 'Free tier').map((s) => {
                const sharePct = totalMTD > 0 ? Math.round((s.cost / totalMTD) * 100) : 0;
                return (
                  <tr key={s.service}>
                    <td style={{ fontWeight: 500 }}>{s.service}</td>
                    <td><span className="badge badge-unknown" style={{ fontSize: 11 }}>{s.category}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.sku}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {s.cost > 0 ? `$${s.cost.toFixed(2)}` : <span style={{ color: 'var(--saws-green)', fontSize: 12 }}>Free</span>}
                    </td>
                    <td>
                      {s.cost > 0
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 3 }}>
                              <div style={{ width: `${sharePct}%`, height: '100%', background: 'var(--saws-brand-blue)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28 }}>{sharePct}%</span>
                          </div>
                        : null
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--surface-2)', borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text)' }}>Cost optimization notes:</strong><br />
              • <strong>AI Search (Basic ~$75/mo)</strong> is the largest fixed cost — scales to S1 ($250/mo) when document count exceeds ~15K chunks.<br />
              • <strong>Azure OpenAI</strong> is usage-based — cost grows linearly with query volume. GPT-4o-mini can replace GPT-4o for simple Q&A to reduce this by ~80%.<br />
              • <strong>Container Apps (Consumption)</strong> scales to zero at night — no idle cost.<br />
              • <strong>Document Intelligence</strong> is one-time per document ingestion; daily re-ingestion should be avoided.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab: Tag Strategy ─────────────────────────────────────────── */}
      {tab === 'tags' && tags && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Required Azure Tags</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Every Azure resource in the AquaCore PoC must carry these tags. Tags are the only mechanism that
              allows Azure Cost Management to split costs by module. Without them, all spend appears as
              an undifferentiated blob in the subscription bill.
            </p>
            <table className="data-table">
              <thead>
                <tr><th>Tag Key</th><th>Example Value</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                {(tags.strategy?.requiredTags ?? []).map((t) => (
                  <tr key={t.key}>
                    <td><code style={{ fontSize: 12 }}>{t.key}</code></td>
                    <td><code style={{ fontSize: 12, color: 'var(--saws-brand-blue)' }}>{t.example}</code></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Shared Platform Resources</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              These resources are shared across all modules and tagged <code>module=platform</code>.
              Their costs appear in the "Platform (Shared)" row above — not allocated to individual modules in the PoC.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(tags.strategy?.sharedResources?.resources ?? []).map((r) => (
                <span key={r} className="badge badge-unknown">{r}</span>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Bicep Tag Pattern</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Add this block to every Bicep module. All child resources inherit tags via the module's
              <code> tags</code> parameter.
            </p>
            <pre style={{
              background: 'var(--surface-0)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '1rem',
              fontSize: 12,
              overflowX: 'auto',
              margin: 0,
              fontFamily: 'ui-monospace, monospace',
              color: 'var(--text)',
              lineHeight: 1.6,
            }}>
{`// In main.bicep or each module Bicep — define once, pass everywhere
var resourceTags = {
  project:     'aquacore'
  module:      moduleName       // e.g. 'aquadocs', 'aquarecords'
  environment: environment      // 'poc', 'dev', 'qa', 'prod'
  component:   componentName    // 'api', 'pipeline', 'search', 'db'
  cost-center: 'IS-DIGITAL'
}

// Pass to every resource
resource searchService 'Microsoft.Search/searchServices@2023-11-01' = {
  name:     searchName
  location: location
  tags:     resourceTags        // ← required on every resource
  sku: { name: 'basic' }
}`}
            </pre>
            <div className="alert alert-info" style={{ marginTop: '0.75rem' }}>
              <strong>Action required:</strong> Before provisioning any Azure resource for the PoC,
              verify its Bicep template passes <code>tags: resourceTags</code>. Resources deployed
              without tags cannot be attributed to a module and will appear as unallocated spend.
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '0.75rem' }}>Live Tag Compliance</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {tags.compliance?._message ?? 'Configure Azure credentials to check live resource tag compliance.'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Required env vars on AquaHawk server: <code>AZURE_SUBSCRIPTION_ID</code>, <code>AZURE_TENANT_ID</code>,{' '}
              <code>AZURE_COST_SP_CLIENT_ID</code>, <code>AZURE_COST_SP_CLIENT_SECRET</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function BudgetBar({ pct, status, small }) {
  const color = status === 'error' ? 'var(--saws-red)' : status === 'warning' ? 'var(--saws-orange)' : 'var(--saws-green)';
  const height = small ? 6 : 10;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height, background: 'var(--surface-3)', borderRadius: height / 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: height / 2, transition: 'width 0.4s ease' }} />
      </div>
      {!small && <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 36 }}>{pct}%</span>}
    </div>
  );
}
