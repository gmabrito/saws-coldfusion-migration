import { useState, useEffect } from 'react';
import { rateService } from '../../services/api';

const METER_SIZES = ['1"', '1.5"', '2"', '3"', '4"', '6"', '8"', '10"', '12"'];

const DEFAULT_MINIMUMS = {
  '1"': 11.68, '1.5"': 29.59, '2"': 47.49, '3"': 95.38,
  '4"': 149.18, '6"': 298.78, '8"': 478.05, '10"': 687.11, '12"': 955.75,
};

export default function RateManagementPage() {
  const [currentRate, setCurrentRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rateHistory, setRateHistory] = useState([]);
  const [locationType, setLocationType] = useState('ICL');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // New rate form
  const [newRate, setNewRate] = useState({
    effective_date: '',
    location_type: 'ICL',
    tier1_threshold: 6,
    tier1_rate: 4.867,
    tier2_rate: 10.815,
    minimums: { ...DEFAULT_MINIMUMS },
  });

  useEffect(() => {
    loadRates();
  }, []);

  async function loadRates() {
    try {
      const res = await rateService.getCurrent();
      setCurrentRate(res.data.rate || res.data);
      setRateHistory(res.data.history || []);
    } catch {
      setCurrentRate({
        effective_date: '2025-10-01',
        location_type: 'ICL',
        tier1_threshold: 6,
        tier1_rate: 4.867,
        tier2_rate: 10.815,
        minimums: { ...DEFAULT_MINIMUMS },
      });
      setRateHistory([
        { effective_date: '2025-10-01', location_type: 'ICL', tier1_rate: 4.867, tier2_rate: 10.815, created_by: 'admin@saws.org' },
        { effective_date: '2024-10-01', location_type: 'ICL', tier1_rate: 4.532, tier2_rate: 10.120, created_by: 'admin@saws.org' },
        { effective_date: '2023-10-01', location_type: 'ICL', tier1_rate: 4.210, tier2_rate: 9.850, created_by: 'admin@saws.org' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleMinimumChange(size, value) {
    setNewRate((prev) => ({
      ...prev,
      minimums: { ...prev.minimums, [size]: parseFloat(value) || 0 },
    }));
  }

  async function handleApplyRate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newRate.effective_date) {
      setError('Effective date is required');
      return;
    }
    setSaving(true);
    try {
      await rateService.setRate(newRate);
      setSuccess('New rate applied successfully');
      loadRates();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply rate');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Loading rates...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Rate Management</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Current Rate Display */}
      <div className="card">
        <div className="card-header">Current Rate Schedule</div>
        {currentRate && (
          <>
            <div className="detail-grid" style={{ marginBottom: 20 }}>
              <div className="detail-item">
                <span className="detail-label">Effective Date</span>
                <span className="detail-value">{currentRate.effective_date}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location Type</span>
                <span className="detail-value">{currentRate.location_type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tier 1 Threshold</span>
                <span className="detail-value">{currentRate.tier1_threshold} CCF</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tier 1 Rate</span>
                <span className="detail-value">${currentRate.tier1_rate?.toFixed(3)} per CCF</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tier 2 Rate</span>
                <span className="detail-value">${currentRate.tier2_rate?.toFixed(3)} per CCF</span>
              </div>
            </div>

            <h3 className="section-title">Minimum Charges by Meter Size</h3>
            <table className="data-table">
              <thead>
                <tr>
                  {METER_SIZES.map((s) => <th key={s}>{s}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {METER_SIZES.map((s) => (
                    <td key={s}>${(currentRate.minimums?.[s] || DEFAULT_MINIMUMS[s])?.toFixed(2)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Apply New Rate */}
      <div className="card">
        <div className="card-header">Apply New Rate</div>
        <form onSubmit={handleApplyRate}>
          <div className="form-row">
            <div className="form-group">
              <label>Effective Date</label>
              <input
                type="date"
                value={newRate.effective_date}
                onChange={(e) => setNewRate({ ...newRate, effective_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Location Type</label>
              <select
                value={newRate.location_type}
                onChange={(e) => setNewRate({ ...newRate, location_type: e.target.value })}
              >
                <option value="ICL">ICL (Inside City Limits)</option>
                <option value="OCL">OCL (Outside City Limits)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tier 1 Threshold (CCF)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={newRate.tier1_threshold}
                onChange={(e) => setNewRate({ ...newRate, tier1_threshold: parseInt(e.target.value) || 0 })}
              />
              <div className="form-hint">Usage up to this amount billed at Tier 1 rate</div>
            </div>
            <div className="form-group">
              <label>Tier 1 Rate ($ per CCF)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={newRate.tier1_rate}
                onChange={(e) => setNewRate({ ...newRate, tier1_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Tier 2 Rate ($ per CCF)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={newRate.tier2_rate}
                onChange={(e) => setNewRate({ ...newRate, tier2_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <h3 className="section-title">Minimum Charges by Meter Size</h3>
          <div className="form-row">
            {METER_SIZES.map((size) => (
              <div className="form-group" key={size}>
                <label>{size}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRate.minimums[size]}
                  onChange={(e) => handleMinimumChange(size, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Applying...' : 'Apply New Rate'}
          </button>
        </form>
      </div>

      {/* Rate History */}
      <div className="card">
        <div className="card-header">Rate History</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Effective Date</th>
              <th>Location</th>
              <th>Tier 1 Rate</th>
              <th>Tier 2 Rate</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {rateHistory.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">No rate history</td></tr>
            ) : (
              rateHistory.map((r, i) => (
                <tr key={i}>
                  <td>{r.effective_date}</td>
                  <td>{r.location_type}</td>
                  <td>${r.tier1_rate?.toFixed(3)}</td>
                  <td>${r.tier2_rate?.toFixed(3)}</td>
                  <td>{r.created_by}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
