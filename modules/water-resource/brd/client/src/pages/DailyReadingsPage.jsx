import { useState, useEffect } from 'react';
import { statsService } from '../services/api';

// BRD 7.1/7.3: Table of daily readings with date range filter
export default function DailyReadingsPage() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default date range: last 30 days
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    loadReadings();
  }, []);

  async function loadReadings() {
    setLoading(true);
    setError(null);
    try {
      const res = await statsService.getDailyReadings(startDate, endDate);
      setReadings(res.data.data);
    } catch (err) {
      console.error('Error loading readings:', err);
      setError('Failed to load daily readings. The API server may not be running.');
      // Set mock data for prototype demonstration
      setMockReadings();
    } finally {
      setLoading(false);
    }
  }

  function setMockReadings() {
    const mock = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.min(Math.ceil((end - start) / (1000 * 60 * 60 * 24)), 30);
    for (let i = 0; i < days; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() - i);
      mock.push({
        ReadingID: i + 1,
        ReadingDate: date.toISOString().split('T')[0],
        BexarLevel: (668.2 - i * 0.3 + Math.random() * 2).toFixed(1),
        MedinaLevel: (634.5 - i * 0.2 + Math.random() * 1.5).toFixed(1),
        UvaldeLevel: (873.1 + i * 0.1 + Math.random() * 1).toFixed(1),
        ComalLevel: (550.3 - i * 0.25 + Math.random() * 1.8).toFixed(1),
        HaysLevel: (414.8 + i * 0.05 + Math.random() * 0.8).toFixed(1),
        Precipitation: (Math.random() * 0.6).toFixed(2),
        TemperatureHigh: (91 - i * 0.3 + Math.random() * 3).toFixed(0),
        TemperatureLow: (70 - i * 0.2 + Math.random() * 2).toFixed(0),
        TotalPumpage: (10892.3 + Math.random() * 500).toFixed(2)
      });
    }
    setReadings(mock);
  }

  function handleFilter(e) {
    e.preventDefault();
    if (startDate > endDate) {
      setError('Start date must be before end date.');
      return;
    }
    loadReadings();
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  function formatNumber(val, decimals = 1) {
    if (val === null || val === undefined) return '--';
    return Number(val).toFixed(decimals);
  }

  return (
    <div>
      <div className="section-header">
        <h2>Daily Readings</h2>
        <span className="section-subtitle">{readings.length} records found</span>
      </div>

      {error && <div className="alert alert-info">{error}</div>}

      {/* BRD 7.3: Date range filter */}
      <form className="filter-bar" onSubmit={handleFilter}>
        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Loading...' : 'Apply Filter'}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setStartDate(thirtyDaysAgo);
            setEndDate(today);
          }}
        >
          Reset
        </button>
      </form>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading readings...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bexar (ft)</th>
                  <th>Medina (ft)</th>
                  <th>Uvalde (ft)</th>
                  <th>Comal (ft)</th>
                  <th>Hays (ft)</th>
                  <th>Precip. (in)</th>
                  <th>High (&deg;F)</th>
                  <th>Low (&deg;F)</th>
                  <th>Pumpage (AF)</th>
                </tr>
              </thead>
              <tbody>
                {readings.map((r) => (
                  <tr key={r.ReadingID}>
                    <td>{formatDate(r.ReadingDate)}</td>
                    <td>{formatNumber(r.BexarLevel)}</td>
                    <td>{formatNumber(r.MedinaLevel)}</td>
                    <td>{formatNumber(r.UvaldeLevel)}</td>
                    <td>{formatNumber(r.ComalLevel)}</td>
                    <td>{formatNumber(r.HaysLevel)}</td>
                    <td>{formatNumber(r.Precipitation, 2)}</td>
                    <td>{formatNumber(r.TemperatureHigh, 0)}</td>
                    <td>{formatNumber(r.TemperatureLow, 0)}</td>
                    <td>{Number(r.TotalPumpage || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {readings.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', color: '#6c757d', padding: '24px' }}>
                      No readings found for the selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
