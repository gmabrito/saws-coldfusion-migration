import { useState, useEffect } from 'react';
import axios from 'axios';

export default function BudgetPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/internal/admin/budget')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading budget data...</div>;
  if (error) return <div className="alert alert-danger">Failed to load budget: {error}</div>;

  function pctBar(spend, limit) {
    const pct = limit > 0 ? Math.min(100, Math.round((spend / limit) * 100)) : 0;
    const color = pct > 90 ? '#d32f2f' : pct > 70 ? '#f28428' : '#00A344';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 8, background: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--saws-text-muted)', minWidth: 32 }}>{pct}%</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>AI Budget Limits</h1>
        <span className="badge badge-ok">Admin</span>
      </div>

      {data._stub && (
        <div className="alert alert-info">
          Budget data is a PoC placeholder. Post-PoC: will pull from Azure Cost Management API.
          All spend is $0 because Azure OpenAI is not yet configured.
        </div>
      )}

      <div className="card">
        <div className="card-header">Monthly Budget — {data.billingPeriod}</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Monthly Limit</th>
              <th>Current Spend</th>
              <th>Remaining</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            {data.budgetLimits.map((row) => (
              <tr key={row.department}>
                <td><strong>{row.department}</strong></td>
                <td>${row.monthlyLimit.toLocaleString()}</td>
                <td>${row.currentSpend.toFixed(2)}</td>
                <td style={{ color: 'var(--saws-green)' }}>${(row.monthlyLimit - row.currentSpend).toFixed(2)}</td>
                <td style={{ minWidth: 160 }}>{pctBar(row.currentSpend, row.monthlyLimit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">Azure OpenAI Pricing Reference (South Central US)</div>
        <table className="data-table">
          <thead>
            <tr><th>Model</th><th>Input (per 1K tokens)</th><th>Output (per 1K tokens)</th></tr>
          </thead>
          <tbody>
            <tr><td>GPT-4o</td><td>$0.005</td><td>$0.015</td></tr>
            <tr><td>text-embedding-3-large</td><td>$0.00013</td><td>N/A</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 12, color: 'var(--saws-text-muted)', marginTop: 8 }}>
          Pricing is approximate. Check Azure portal for current rates. Budget enforcement post-PoC via Azure Cost Management alerts.
        </p>
      </div>
    </div>
  );
}
