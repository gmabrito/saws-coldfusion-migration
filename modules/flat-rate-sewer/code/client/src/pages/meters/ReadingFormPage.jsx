import { useState, useEffect } from 'react';
import { accountService, meterService, readingService } from '../../services/api';

export default function ReadingFormPage() {
  const [accountNum, setAccountNum] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [meters, setMeters] = useState([]);
  const [selectedMeter, setSelectedMeter] = useState('');
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [readingValue, setReadingValue] = useState('');
  const [previousReading, setPreviousReading] = useState(null);
  const [recentReadings, setRecentReadings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load accounts for dropdown
  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const res = await accountService.getAll({ limit: 500 });
      const body = res.data;
      setAccounts(body.data || body.accounts || (Array.isArray(body) ? body : []));
    } catch {
      setAccounts([
        { account_num: '100234', business_name: 'Downtown Car Wash' },
        { account_num: '100198', business_name: 'River City Laundry' },
        { account_num: '100301', business_name: 'SA Brewing Co' },
        { account_num: '100102', business_name: 'Alamo Heights Dentistry' },
      ]);
    }
  }

  // Load meters when account changes
  useEffect(() => {
    if (accountNum) {
      loadMeters();
      loadRecentReadings();
    } else {
      setMeters([]);
      setRecentReadings([]);
    }
  }, [accountNum]);

  async function loadMeters() {
    try {
      const res = await meterService.getByAccount(accountNum);
      const body = res.data;
      const all = body.data || body.meters || (Array.isArray(body) ? body : []);
      const active = all.filter((m) => m.is_active === true || m.is_active === 'true' || m.status === 'ACTIVE');
      setMeters(active);
      setSelectedMeter('');
    } catch {
      setMeters([
        { meter_id: 1, serial_number: 'MTR-001', size: '2"', meter_function: 'INCOMING', status: 'ACTIVE' },
        { meter_id: 2, serial_number: 'MTR-002', size: '1"', meter_function: 'MAKEUP', status: 'ACTIVE' },
      ]);
    }
  }

  async function loadRecentReadings() {
    try {
      const res = await readingService.getAll({ accountNum, limit: 10 });
      const body = res.data;
      setRecentReadings(body.data || body.readings || (Array.isArray(body) ? body : []));
    } catch {
      setRecentReadings([
        { reading_id: 1, meter_serial: 'MTR-001', reading_date: '2026-03-15', reading_value: 45230, consumption: 1200, consumption_ccf: 16.04 },
        { reading_id: 2, meter_serial: 'MTR-001', reading_date: '2026-02-15', reading_value: 44030, consumption: 1350, consumption_ccf: 18.05 },
        { reading_id: 3, meter_serial: 'MTR-002', reading_date: '2026-03-15', reading_value: 12400, consumption: 300, consumption_ccf: 4.01 },
      ]);
    }
  }

  // When meter changes, find previous reading
  useEffect(() => {
    if (selectedMeter) {
      const meter = meters.find((m) => m.serial === selectedMeter);
      if (meter) {
        const prev = recentReadings.find((r) => r.serial === meter.serial);
        setPreviousReading(prev || null);
      }
    } else {
      setPreviousReading(null);
    }
  }, [selectedMeter, recentReadings, meters]);

  const consumption = readingValue && previousReading
    ? parseInt(readingValue) - previousReading.reading_value
    : null;

  const isRollover = consumption !== null && consumption < 0;
  const consumptionCCF = consumption !== null && consumption >= 0 ? (consumption / 748.052).toFixed(2) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!accountNum || !selectedMeter || !readingDate || !readingValue) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      await readingService.submit({
        accountNum: accountNum,
        serial: selectedMeter,
        readingDate: readingDate,
        readingValue: parseInt(readingValue),
      });
      setSuccess('Reading submitted successfully');
      setReadingValue('');
      loadRecentReadings();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit reading');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Submit Reading</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-header">New Meter Reading</div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Account</label>
              <select value={accountNum} onChange={(e) => setAccountNum(e.target.value)} required>
                <option value="">-- Select Account --</option>
                {accounts.map((a) => (
                  <option key={a.account_num} value={a.account_num}>
                    {a.account_num} - {a.business_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Meter</label>
              <select value={selectedMeter} onChange={(e) => setSelectedMeter(e.target.value)} required disabled={!accountNum}>
                <option value="">-- Select Meter --</option>
                {meters.map((m) => (
                  <option key={m.meter_id || m.serial} value={m.serial}>
                    {m.serial} ({m.function_type}, {m.meter_size})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Reading Date</label>
              <input type="date" value={readingDate} onChange={(e) => setReadingDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Reading Value</label>
              <input
                type="number"
                value={readingValue}
                onChange={(e) => setReadingValue(e.target.value)}
                required
                min="0"
                placeholder="Current meter reading"
              />
            </div>
          </div>

          {/* Calculated Fields */}
          {previousReading && (
            <div className="card" style={{ background: 'var(--saws-light)', marginBottom: 16 }}>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Previous Reading</span>
                  <span className="detail-value">{previousReading.reading_value?.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Previous Date</span>
                  <span className="detail-value">{previousReading.reading_date}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Consumption (gallons)</span>
                  <span className="detail-value" style={{ color: isRollover ? 'var(--saws-red)' : 'inherit' }}>
                    {consumption !== null ? consumption.toLocaleString() : '--'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Consumption (CCF)</span>
                  <span className="detail-value">{consumptionCCF ?? '--'}</span>
                </div>
              </div>
              {isRollover && (
                <div className="alert alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
                  Warning: Negative consumption detected. This may indicate a meter rollover or reset.
                  Please verify the reading value before submitting.
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Reading'}
          </button>
        </form>
      </div>

      {/* Recent Readings */}
      {accountNum && (
        <div className="card">
          <div className="card-header">Recent Readings for Account {accountNum}</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Meter</th>
                <th>Date</th>
                <th>Reading</th>
                <th>Consumption (gal)</th>
                <th>Consumption (CCF)</th>
              </tr>
            </thead>
            <tbody>
              {recentReadings.length === 0 ? (
                <tr><td colSpan={5} className="empty-state">No readings</td></tr>
              ) : (
                recentReadings.map((r) => (
                  <tr key={r.reading_id}>
                    <td>{r.meter_serial}</td>
                    <td>{r.reading_date}</td>
                    <td>{r.reading_value?.toLocaleString()}</td>
                    <td>{r.consumption?.toLocaleString()}</td>
                    <td>{r.consumption_ccf?.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
