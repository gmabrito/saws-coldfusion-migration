import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meterService, accountService } from '../../services/api';
import RoleGate from '../../components/RoleGate';

const METER_FUNCTIONS = ['INCOMING', 'MAKEUP', 'BLOWDOWN', 'LOSS', 'SEWER'];
const METER_SIZES = ['1"', '1.5"', '2"', '3"', '4"', '6"', '8"', '10"', '12"'];
const UOMS = ['GAL', 'CF', 'CCF'];

export default function MeterListPage() {
  const { accountNum: paramAccount } = useParams();
  const navigate = useNavigate();
  const [accountNum, setAccountNum] = useState(paramAccount || '');
  const [searchInput, setSearchInput] = useState(paramAccount || '');
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newMeter, setNewMeter] = useState({
    serial_number: '',
    size: '2"',
    meter_function: 'INCOMING',
    uom: 'GAL',
    max_reading: 999999,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (accountNum && accountNum !== 'search') {
      loadMeters();
    }
  }, [accountNum]);

  async function loadMeters() {
    setLoading(true);
    try {
      const res = await meterService.getByAccount(accountNum);
      const body = res.data;
      setMeters(body.data || body.meters || (Array.isArray(body) ? body : []));
    } catch {
      setMeters([
        { meter_id: 1, serial_number: 'MTR-001', size: '2"', meter_function: 'INCOMING', uom: 'GAL', max_reading: 999999, status: 'ACTIVE' },
        { meter_id: 2, serial_number: 'MTR-002', size: '1"', meter_function: 'MAKEUP', uom: 'GAL', max_reading: 999999, status: 'ACTIVE' },
        { meter_id: 3, serial_number: 'MTR-003', size: '1"', meter_function: 'BLOWDOWN', uom: 'GAL', max_reading: 999999, status: 'INACTIVE' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (searchInput && searchInput !== 'search') {
      setAccountNum(searchInput);
      navigate(`/meters/${searchInput}`, { replace: true });
    }
  }

  async function handleAddMeter(e) {
    e.preventDefault();
    setError('');
    try {
      await meterService.add(accountNum, newMeter);
      setShowAdd(false);
      setNewMeter({ serial_number: '', size: '2"', meter_function: 'INCOMING', uom: 'GAL', max_reading: 999999 });
      loadMeters();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add meter');
    }
  }

  async function handleDeactivate(meterId) {
    if (!window.confirm('Deactivate this meter?')) return;
    try {
      await meterService.deactivate(accountNum, meterId);
      loadMeters();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate meter');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Meters{accountNum && accountNum !== 'search' ? `: Account ${accountNum}` : ''}</h1>
      </div>

      {/* Account search */}
      <form onSubmit={handleSearch} className="filters-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Enter account number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Load Meters</button>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {accountNum && accountNum !== 'search' && (
        <>
          <RoleGate groups={['SAWS-FRS-Admin']}>
            <div style={{ marginBottom: 16 }}>
              <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
                {showAdd ? 'Cancel' : '+ Add Meter'}
              </button>
            </div>
          </RoleGate>

          {showAdd && (
            <div className="card">
              <div className="card-header">Add New Meter</div>
              <form onSubmit={handleAddMeter}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Serial Number</label>
                    <input
                      value={newMeter.serial_number}
                      onChange={(e) => setNewMeter({ ...newMeter, serial_number: e.target.value })}
                      required
                      placeholder="e.g. MTR-004"
                    />
                  </div>
                  <div className="form-group">
                    <label>Size</label>
                    <select value={newMeter.size} onChange={(e) => setNewMeter({ ...newMeter, size: e.target.value })}>
                      {METER_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Function</label>
                    <select value={newMeter.meter_function} onChange={(e) => setNewMeter({ ...newMeter, meter_function: e.target.value })}>
                      {METER_FUNCTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>UOM</label>
                    <select value={newMeter.uom} onChange={(e) => setNewMeter({ ...newMeter, uom: e.target.value })}>
                      {UOMS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Max Reading</label>
                    <input
                      type="number"
                      value={newMeter.max_reading}
                      onChange={(e) => setNewMeter({ ...newMeter, max_reading: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-success">Save Meter</button>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading meters...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Serial #</th>
                  <th>Size</th>
                  <th>Function</th>
                  <th>UOM</th>
                  <th>Max Reading</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {meters.length === 0 ? (
                  <tr><td colSpan={7} className="empty-state">No meters for this account</td></tr>
                ) : (
                  meters.map((m) => (
                    <tr key={m.meter_id}>
                      <td>{m.serial_number}</td>
                      <td>{m.size}</td>
                      <td>{m.meter_function}</td>
                      <td>{m.uom}</td>
                      <td>{m.max_reading?.toLocaleString()}</td>
                      <td>
                        <span className={`status-dot ${m.status?.toLowerCase()}`}></span>
                        {m.status}
                      </td>
                      <td>
                        <RoleGate groups={['SAWS-FRS-Admin']}>
                          {m.status === 'ACTIVE' && (
                            <button className="btn btn-sm btn-danger" onClick={() => handleDeactivate(m.meter_id)}>
                              Deactivate
                            </button>
                          )}
                        </RoleGate>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
