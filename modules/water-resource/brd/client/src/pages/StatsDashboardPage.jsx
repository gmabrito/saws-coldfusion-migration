import { useState, useEffect } from 'react';
import { statsService } from '../services/api';

// BRD 7.1: Dashboard showing 30-day summary
// Aquifer & Water Stats: water levels for 5 counties, precipitation, temperatures, total pumpage
export default function StatsDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [countyLevels, setCountyLevels] = useState([]);
  const [recentReadings, setRecentReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, countyRes, dailyRes] = await Promise.all([
        statsService.getSummary(),
        statsService.getCountyLevels(),
        statsService.getDailyReadings()
      ]);
      setSummary(summaryRes.data.data);
      setCountyLevels(countyRes.data.data);
      setRecentReadings(dailyRes.data.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. The API server may not be running.');
      // Set mock data for prototype demonstration
      setMockData();
    } finally {
      setLoading(false);
    }
  }

  function setMockData() {
    setSummary([{
      AvgBexarLevel: 665.4,
      AvgMedinaLevel: 632.1,
      AvgUvaldeLevel: 871.3,
      AvgComalLevel: 548.7,
      AvgHaysLevel: 412.9,
      AvgPrecipitation: 0.12,
      AvgTemperatureHigh: 89.2,
      AvgTemperatureLow: 68.5,
      TotalPumpageSum: 324567.50,
      ReadingCount: 30,
      LatestReadingDate: '2026-04-12',
      LatestBexarLevel: 668.2,
      LatestPrecipitation: 0.05,
      LatestTemperatureHigh: 91,
      LatestTemperatureLow: 70,
      LatestTotalPumpage: 10892.30
    }]);

    setCountyLevels([
      { County: 'Bexar', LatestLevel: 668.2, AvgLevel: 665.4, MinLevel: 658.1, MaxLevel: 672.8 },
      { County: 'Medina', LatestLevel: 634.5, AvgLevel: 632.1, MinLevel: 627.3, MaxLevel: 638.9 },
      { County: 'Uvalde', LatestLevel: 873.1, AvgLevel: 871.3, MinLevel: 865.7, MaxLevel: 878.2 },
      { County: 'Comal', LatestLevel: 550.3, AvgLevel: 548.7, MinLevel: 543.2, MaxLevel: 555.1 },
      { County: 'Hays', LatestLevel: 414.8, AvgLevel: 412.9, MinLevel: 408.5, MaxLevel: 418.3 }
    ]);

    const mockReadings = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      mockReadings.push({
        ReadingID: i + 1,
        ReadingDate: date.toISOString().split('T')[0],
        BexarLevel: (668.2 - i * 0.5).toFixed(1),
        MedinaLevel: (634.5 - i * 0.3).toFixed(1),
        UvaldeLevel: (873.1 + i * 0.2).toFixed(1),
        ComalLevel: (550.3 - i * 0.4).toFixed(1),
        HaysLevel: (414.8 + i * 0.1).toFixed(1),
        Precipitation: (Math.random() * 0.5).toFixed(2),
        TemperatureHigh: (91 - i).toFixed(0),
        TemperatureLow: (70 - i * 0.5).toFixed(0),
        TotalPumpage: (10892.3 + i * 100).toFixed(2)
      });
    }
    setRecentReadings(mockReadings);
  }

  function formatNumber(val, decimals = 1) {
    if (val === null || val === undefined) return '--';
    return Number(val).toFixed(decimals);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  const stats = summary?.[0] || {};

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>30-Day Aquifer Statistics Dashboard</h2>
          <span className="section-subtitle">
            Data through {formatDate(stats.LatestReadingDate)} | {stats.ReadingCount || 0} readings in period
          </span>
        </div>
        <button className="btn btn-secondary" onClick={loadDashboardData}>
          Refresh
        </button>
      </div>

      {error && <div className="alert alert-info">{error}</div>}

      {/* BRD 7.1: Summary cards at top */}
      <div className="summary-cards">
        <div className="summary-card blue">
          <div className="card-label">Latest Precipitation</div>
          <div className="card-value">{formatNumber(stats.LatestPrecipitation, 2)}"</div>
          <div className="card-unit">inches</div>
          <div className="card-subtext">30-day avg: {formatNumber(stats.AvgPrecipitation, 2)}"</div>
        </div>
        <div className="summary-card orange">
          <div className="card-label">Temperature High</div>
          <div className="card-value">{formatNumber(stats.LatestTemperatureHigh, 0)}&deg;</div>
          <div className="card-unit">fahrenheit</div>
          <div className="card-subtext">30-day avg: {formatNumber(stats.AvgTemperatureHigh, 0)}&deg;</div>
        </div>
        <div className="summary-card green">
          <div className="card-label">Temperature Low</div>
          <div className="card-value">{formatNumber(stats.LatestTemperatureLow, 0)}&deg;</div>
          <div className="card-unit">fahrenheit</div>
          <div className="card-subtext">30-day avg: {formatNumber(stats.AvgTemperatureLow, 0)}&deg;</div>
        </div>
        <div className="summary-card navy">
          <div className="card-label">Total Pumpage</div>
          <div className="card-value">{Number(stats.LatestTotalPumpage || 0).toLocaleString()}</div>
          <div className="card-unit">acre-feet</div>
          <div className="card-subtext">30-day total: {Number(stats.TotalPumpageSum || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* BRD 7.1: Water levels per county */}
      <div className="card">
        <div className="card-header">
          <h2>Water Levels by County</h2>
          <span className="section-subtitle">Feet above mean sea level (ft MSL)</span>
        </div>
        <div className="county-grid">
          {countyLevels.map((county) => (
            <div key={county.County} className="county-card">
              <div className="county-name">{county.County}</div>
              <div className="county-level">{formatNumber(county.LatestLevel)}</div>
              <div className="county-unit">ft MSL</div>
              <div className="county-avg">
                30-day avg: {formatNumber(county.AvgLevel)} |
                Range: {formatNumber(county.MinLevel)} - {formatNumber(county.MaxLevel)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Readings Table */}
      <div className="card">
        <div className="card-header">
          <h2>Recent Daily Readings</h2>
          <span className="section-subtitle">Last 7 days</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Bexar</th>
                <th>Medina</th>
                <th>Uvalde</th>
                <th>Comal</th>
                <th>Hays</th>
                <th>Precip.</th>
                <th>High</th>
                <th>Low</th>
                <th>Pumpage</th>
              </tr>
            </thead>
            <tbody>
              {recentReadings.slice(0, 7).map((r) => (
                <tr key={r.ReadingID}>
                  <td>{formatDate(r.ReadingDate)}</td>
                  <td>{formatNumber(r.BexarLevel)}</td>
                  <td>{formatNumber(r.MedinaLevel)}</td>
                  <td>{formatNumber(r.UvaldeLevel)}</td>
                  <td>{formatNumber(r.ComalLevel)}</td>
                  <td>{formatNumber(r.HaysLevel)}</td>
                  <td>{formatNumber(r.Precipitation, 2)}"</td>
                  <td>{formatNumber(r.TemperatureHigh, 0)}&deg;</td>
                  <td>{formatNumber(r.TemperatureLow, 0)}&deg;</td>
                  <td>{Number(r.TotalPumpage || 0).toLocaleString()}</td>
                </tr>
              ))}
              {recentReadings.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', color: '#6c757d', padding: '24px' }}>
                    No readings available. Use Data Entry to add daily readings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
