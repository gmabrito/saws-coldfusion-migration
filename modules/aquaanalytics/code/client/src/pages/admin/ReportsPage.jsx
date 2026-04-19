import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    axios.get('/api/internal/admin/reports')
      .then((res) => setReports(res.data.availableReports || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function generateReport(reportId) {
    setGenerating(reportId);
    setResult(null);
    try {
      const res = await axios.post(`/api/internal/admin/reports/${reportId}`, dateRange);
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(null);
    }
  }

  if (loading) return <div className="loading">Loading available reports...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Report Generation</h1>
        <span className="badge badge-ok">Admin</span>
      </div>

      <div className="alert alert-info">
        PoC: Reports return mock/stub data. Post-PoC: live SQL results + CSV/XLSX export via Azure Blob Storage.
      </div>

      <div className="card">
        <div className="card-header">Date Range (optional)</div>
        <div className="form-row">
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {reports.map((report) => (
          <div key={report.id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--saws-navy)' }}>{report.name}</span>
                  <span className="badge" style={{ background: '#e9ecef', color: '#495057', textTransform: 'none', fontWeight: 400 }}>
                    {report.format}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--saws-text-muted)', marginBottom: 6 }}>{report.description}</p>
                <span style={{ fontSize: 12, color: report.status === 'available' ? 'var(--saws-green)' : 'var(--saws-orange)' }}>
                  {report.status}
                </span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => generateReport(report.id)}
                disabled={generating === report.id}
                style={{ marginLeft: 16, minWidth: 100 }}
              >
                {generating === report.id ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            Report: {result.reportId}
            <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--saws-text-muted)', marginLeft: 12 }}>
              Generated {new Date(result.generatedAt).toLocaleString()}
            </span>
          </div>
          {result._stub && (
            <div className="alert alert-warning">Stub result — live data available post-PoC when DB is provisioned.</div>
          )}
          <pre style={{ background: 'var(--saws-light)', padding: 16, borderRadius: 'var(--radius)', fontSize: 12, overflow: 'auto', maxHeight: 300 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginTop: 16 }}>Error: {error}</div>
      )}
    </div>
  );
}
