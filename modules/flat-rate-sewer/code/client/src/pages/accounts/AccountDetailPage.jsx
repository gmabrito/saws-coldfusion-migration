import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { accountService, meterService, readingService, assessmentService } from '../../services/api';
import RoleGate from '../../components/RoleGate';

export default function AccountDetailPage() {
  const { accountNum } = useParams();
  const [account, setAccount] = useState(null);
  const [meters, setMeters] = useState([]);
  const [readings, setReadings] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [accountNum]);

  async function loadAll() {
    setLoading(true);
    try {
      const [acctRes, meterRes, readRes, assessRes] = await Promise.allSettled([
        accountService.getById(accountNum),
        meterService.getByAccount(accountNum),
        readingService.getAll({ account_num: accountNum, limit: 10 }),
        assessmentService.getAll({ account_num: accountNum, limit: 10 }),
      ]);
      setAccount(acctRes.status === 'fulfilled' ? acctRes.value.data : getPlaceholderAccount());
      setMeters(meterRes.status === 'fulfilled' ? (meterRes.value.data.meters || meterRes.value.data || []) : getPlaceholderMeters());
      setReadings(readRes.status === 'fulfilled' ? (readRes.value.data.readings || readRes.value.data || []) : getPlaceholderReadings());
      setAssessments(assessRes.status === 'fulfilled' ? (assessRes.value.data.assessments || assessRes.value.data || []) : []);
    } catch {
      setAccount(getPlaceholderAccount());
      setMeters(getPlaceholderMeters());
      setReadings(getPlaceholderReadings());
    } finally {
      setLoading(false);
    }
  }

  function getPlaceholderAccount() {
    return {
      account_num: accountNum,
      facility_description: 'Commercial Facility',
      meter_size: '2"',
      method: 'METERED',
      billing_basis: 'CONSUMPTION',
      bod_percent: 15.0,
      tdd_percent: 10.0,
      assessment_frequency_months: 12,
      inspection_frequency_months: 24,
      status: 'ACTIVE',
      business_name: 'Sample Business',
      contact_name: 'John Smith',
      address: '123 Commerce St, San Antonio, TX 78205',
      phone: '(210) 555-0100',
      email: 'contact@samplebiz.com',
      next_assessment_date: '2026-06-01',
    };
  }

  function getPlaceholderMeters() {
    return [
      { meter_id: 1, serial_number: 'MTR-001', size: '2"', meter_function: 'INCOMING', uom: 'GAL', max_reading: 999999, status: 'ACTIVE' },
      { meter_id: 2, serial_number: 'MTR-002', size: '1"', meter_function: 'MAKEUP', uom: 'GAL', max_reading: 999999, status: 'ACTIVE' },
    ];
  }

  function getPlaceholderReadings() {
    return [
      { reading_id: 1, meter_serial: 'MTR-001', reading_date: '2026-03-15', reading_value: 45230, consumption: 1200, consumption_ccf: 16.04 },
      { reading_id: 2, meter_serial: 'MTR-001', reading_date: '2026-02-15', reading_value: 44030, consumption: 1350, consumption_ccf: 18.05 },
    ];
  }

  if (loading) return <div className="loading">Loading account...</div>;
  if (!account) return <div className="alert alert-danger">Account not found.</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Account: {account.account_num}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <RoleGate groups={['SAWS-FRS-Admin']}>
            <Link to={`/accounts/${accountNum}/edit`} className="btn btn-primary">Edit Account</Link>
            <Link to={`/reports/assessment/${accountNum}`} className="btn btn-secondary">Assessment Report</Link>
          </RoleGate>
        </div>
      </div>

      {/* Account Info */}
      <div className="card">
        <div className="card-header">Account Information</div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Account Number</span>
            <span className="detail-value">{account.account_num}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Facility</span>
            <span className="detail-value">{account.facility_description}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Meter Size</span>
            <span className="detail-value">{account.meter_size}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Method</span>
            <span className="detail-value">{account.method}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Billing Basis</span>
            <span className="detail-value">{account.billing_basis}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">BOD %</span>
            <span className="detail-value">{account.bod_percent}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">TDD %</span>
            <span className="detail-value">{account.tdd_percent}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Assessment Frequency</span>
            <span className="detail-value">{account.assessment_frequency_months} months</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Inspection Frequency</span>
            <span className="detail-value">{account.inspection_frequency_months} months</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status</span>
            <span className="detail-value">
              <span className={`badge badge-${account.status?.toLowerCase()}`}>{account.status}</span>
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Next Assessment</span>
            <span className="detail-value">{account.next_assessment_date || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="card">
        <div className="card-header">Contact Information</div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Business Name</span>
            <span className="detail-value">{account.business_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Contact Name</span>
            <span className="detail-value">{account.contact_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Address</span>
            <span className="detail-value">{account.address}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone</span>
            <span className="detail-value">{account.phone}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">{account.email}</span>
          </div>
        </div>
      </div>

      {/* Active Meters */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active Meters</span>
          <Link to={`/meters/${accountNum}`} className="btn btn-sm btn-secondary">View All</Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Serial #</th>
              <th>Size</th>
              <th>Function</th>
              <th>UOM</th>
              <th>Max Reading</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {meters.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">No meters</td></tr>
            ) : (
              meters.map((m) => (
                <tr key={m.meter_id}>
                  <td>{m.serial_number}</td>
                  <td>{m.size}</td>
                  <td>{m.meter_function}</td>
                  <td>{m.uom}</td>
                  <td>{m.max_reading?.toLocaleString()}</td>
                  <td><span className={`badge badge-${m.status?.toLowerCase()}`}>{m.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Readings */}
      <div className="card">
        <div className="card-header">Recent Readings</div>
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
            {readings.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">No readings</td></tr>
            ) : (
              readings.map((r) => (
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

      {/* Assessment History */}
      <div className="card">
        <div className="card-header">Assessment History</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Billing Date</th>
              <th>Billed Amount</th>
              <th>Actual Amount</th>
              <th>Difference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assessments.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">No assessments</td></tr>
            ) : (
              assessments.map((a) => (
                <tr key={a.assessment_id} className="clickable-row">
                  <td><Link to={`/assessments/${a.assessment_id}`}>{a.assessment_id}</Link></td>
                  <td>{a.billing_date}</td>
                  <td>${a.billed_amount?.toFixed(2)}</td>
                  <td>${a.actual_amount?.toFixed(2)}</td>
                  <td className={a.difference > 0 ? 'diff-positive' : a.difference < 0 ? 'diff-negative' : ''}>
                    ${a.difference?.toFixed(2)}
                  </td>
                  <td><span className={`badge badge-${a.status?.toLowerCase()}`}>{a.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
