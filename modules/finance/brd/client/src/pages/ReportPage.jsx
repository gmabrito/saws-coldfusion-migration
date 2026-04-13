import { useState, useEffect } from 'react';
import { readingService } from '../services/api';

export default function ReportPage() {
  const [report, setReport] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [month, year]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data } = await readingService.getReport({ month, year });
      setReport(data);
    } catch {
      setError('Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="page">
      <h2>Fire Hydrant Meter Reading Report</h2>

      <div className="filters">
        <div className="form-group">
          <label>Month</label>
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year</label>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Loading report...</p>
      ) : report ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Contract</th>
                <th>Business</th>
                <th>Meter Size</th>
                <th>Reading Date</th>
                <th>Current</th>
                <th>Previous</th>
                <th>Usage</th>
                <th>Reported By</th>
              </tr>
            </thead>
            <tbody>
              {report.readings.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#666' }}>No readings for this period.</td></tr>
              ) : (
                report.readings.map((r, i) => (
                  <tr key={i}>
                    <td>#{r.ContractID}</td>
                    <td>{r.BusinessName}</td>
                    <td>{r.MeterSize}</td>
                    <td>{r.ReadingDate ? new Date(r.ReadingDate).toLocaleDateString() : 'Not submitted'}</td>
                    <td>{r.CurrentReading ?? '-'}</td>
                    <td>{r.PreviousReading ?? '-'}</td>
                    <td>{r.Usage ?? '-'}</td>
                    <td>{r.ReportedBy || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
