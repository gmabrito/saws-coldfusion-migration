import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services/api';

function formatMoney(val) {
  if (val == null) return '--';
  return '$' + Number(val).toFixed(2);
}

function diffClass(diff) {
  if (diff == null) return '';
  if (diff > 0.005) return 'diff-positive';
  if (diff < -0.005) return 'diff-negative';
  return 'diff-zero';
}

export default function AssessmentReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAssessment();
  }, [id]);

  async function loadAssessment() {
    setLoading(true);
    try {
      const res = await assessmentService.getById(id);
      const data = res.data;
      setAssessment(data.assessment || data);
      setLineItems(data.lineItems || data.line_items || []);
    } catch {
      // Placeholder assessment data matching legacy PDF format
      setAssessment({
        assessment_id: id,
        account_num: '100234',
        business_name: 'Downtown Car Wash',
        address: '456 Commerce St, San Antonio, TX 78205',
        meter_size: '2"',
        method: 'METERED',
        billing_basis: 'CONSUMPTION',
        billing_period_start: '2025-04-01',
        billing_period_end: '2026-03-31',
        status: 'DUE',
        assessor: 'admin@saws.org',
        total_billed: 14946.00,
        total_actual_sewer: 13201.60,
        total_actual_charge: 12480.45,
        total_difference: -2465.55,
      });
      setLineItems([
        { month: '2025-04', billing_date: '04/2025', incoming_ccf: 128, billed_charge: 1245.50, actual_sewer_ccf: 112, actual_charge: 1102.30, basis: 'CONS', money_source: 'METER', difference: -143.20 },
        { month: '2025-05', billing_date: '05/2025', incoming_ccf: 135, billed_charge: 1310.25, actual_sewer_ccf: 120, actual_charge: 1175.40, basis: 'CONS', money_source: 'METER', difference: -134.85 },
        { month: '2025-06', billing_date: '06/2025', incoming_ccf: 142, billed_charge: 1378.10, actual_sewer_ccf: 130, actual_charge: 1273.50, basis: 'CONS', money_source: 'METER', difference: -104.60 },
        { month: '2025-07', billing_date: '07/2025', incoming_ccf: 155, billed_charge: 1504.25, actual_sewer_ccf: 140, actual_charge: 1371.60, basis: 'CONS', money_source: 'METER', difference: -132.65 },
        { month: '2025-08', billing_date: '08/2025', incoming_ccf: 160, billed_charge: 1552.80, actual_sewer_ccf: 145, actual_charge: 1420.50, basis: 'CONS', money_source: 'METER', difference: -132.30 },
        { month: '2025-09', billing_date: '09/2025', incoming_ccf: 148, billed_charge: 1436.04, actual_sewer_ccf: 132, actual_charge: 1293.12, basis: 'CONS', money_source: 'METER', difference: -142.92 },
        { month: '2025-10', billing_date: '10/2025', incoming_ccf: 130, billed_charge: 1261.70, actual_sewer_ccf: 115, actual_charge: 1128.75, basis: 'CONS', money_source: 'METER', difference: -132.95 },
        { month: '2025-11', billing_date: '11/2025', incoming_ccf: 118, billed_charge: 1145.22, actual_sewer_ccf: 105, actual_charge: 1029.00, basis: 'CONS', money_source: 'METER', difference: -116.22 },
        { month: '2025-12', billing_date: '12/2025', incoming_ccf: 112, billed_charge: 1086.96, actual_sewer_ccf: 100, actual_charge: 980.00, basis: 'CONS', money_source: 'METER', difference: -106.96 },
        { month: '2026-01', billing_date: '01/2026', incoming_ccf: 105, billed_charge: 1018.55, actual_sewer_ccf: 92, actual_charge: 901.60, basis: 'CONS', money_source: 'METER', difference: -116.95 },
        { month: '2026-02', billing_date: '02/2026', incoming_ccf: 110, billed_charge: 1067.08, actual_sewer_ccf: 98, actual_charge: 960.40, basis: 'CONS', money_source: 'METER', difference: -106.68 },
        { month: '2026-03', billing_date: '03/2026', incoming_ccf: 120, billed_charge: 1339.55, actual_sewer_ccf: 108, actual_charge: 1845.28, basis: 'CONS', money_source: 'METER', difference: 505.73 },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleOverrideChange(month, field, value) {
    setOverrides((prev) => ({
      ...prev,
      [month]: { ...prev[month], [field]: value },
    }));
  }

  function getEffectiveValue(item, field) {
    const override = overrides[item.month]?.[field];
    if (override !== undefined && override !== '') return parseFloat(override);
    return item[field];
  }

  async function handleAccept() {
    setSaving(true);
    setError('');
    try {
      await assessmentService.review(id, { action: 'ACCEPT' });
      navigate('/assessments');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept assessment');
    } finally {
      setSaving(false);
    }
  }

  async function handleOverride() {
    setSaving(true);
    setError('');
    try {
      await assessmentService.override(id, { overrides });
      navigate('/assessments');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save overrides');
    } finally {
      setSaving(false);
    }
  }

  async function handleProgress() {
    setSaving(true);
    setError('');
    try {
      await assessmentService.review(id, { action: 'IN_PROGRESS', overrides });
      loadAssessment();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  }

  // Calculate totals
  const totals = lineItems.reduce(
    (acc, item) => {
      const incomingCCF = getEffectiveValue(item, 'incoming_ccf');
      const billedCharge = item.billed_charge || 0;
      const actualSewerCCF = getEffectiveValue(item, 'actual_sewer_ccf');
      const actualCharge = getEffectiveValue(item, 'actual_charge');
      acc.totalIncoming += incomingCCF || 0;
      acc.totalBilled += billedCharge;
      acc.totalActualSewer += actualSewerCCF || 0;
      acc.totalActualCharge += actualCharge || 0;
      acc.totalDifference += (actualCharge || 0) - billedCharge;
      return acc;
    },
    { totalIncoming: 0, totalBilled: 0, totalActualSewer: 0, totalActualCharge: 0, totalDifference: 0 }
  );

  if (loading) return <div className="loading">Loading assessment...</div>;
  if (!assessment) return <div className="alert alert-danger">Assessment not found.</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Assessment Review #{id}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/assessments" className="btn btn-secondary">Back to List</Link>
          <Link to={`/reports/assessment/${assessment.account_num}`} className="btn btn-secondary">Print Report</Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Account Header */}
      <div className="card">
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Account Number</span>
            <span className="detail-value">
              <Link to={`/accounts/${assessment.account_num}`}>{assessment.account_num}</Link>
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Business Name</span>
            <span className="detail-value">{assessment.business_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Address</span>
            <span className="detail-value">{assessment.address}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Meter Size</span>
            <span className="detail-value">{assessment.meter_size}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Billing Period</span>
            <span className="detail-value">{assessment.billing_period_start} to {assessment.billing_period_end}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status</span>
            <span className="detail-value">
              <span className={`badge badge-${assessment.status?.toLowerCase()}`}>{assessment.status}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-side Billing vs Actual Comparison Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="card-header">Billing vs Actual Comparison</div>
        <table className="assessment-comparison">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Date</th>
              <th colSpan={2} className="billing-header" style={{ textAlign: 'center' }}>BILLING</th>
              <th colSpan={4} className="actual-header" style={{ textAlign: 'center' }}>ACTUAL</th>
              <th style={{ textAlign: 'center' }}>Difference</th>
            </tr>
            <tr>
              <th style={{ textAlign: 'left' }}>Month</th>
              <th className="billing-header">Incoming CCF</th>
              <th className="billing-header">Billed Charge</th>
              <th className="actual-header">Actual Sewer CCF</th>
              <th className="actual-header">Actual Charge</th>
              <th className="actual-header">Basis</th>
              <th className="actual-header">Money</th>
              <th>$ Diff</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => {
              const effectiveIncoming = getEffectiveValue(item, 'incoming_ccf');
              const effectiveActualCharge = getEffectiveValue(item, 'actual_charge');
              const effectiveActualSewer = getEffectiveValue(item, 'actual_sewer_ccf');
              const diff = effectiveActualCharge - (item.billed_charge || 0);
              const hasOverrides = overrides[item.month] && Object.keys(overrides[item.month]).length > 0;

              return (
                <tr key={item.month}>
                  <td style={{ textAlign: 'left', fontWeight: 500 }}>{item.billing_date}</td>
                  {/* Billing columns */}
                  <td className="billing-col">
                    <div className="override-field" style={{ display: 'inline' }}>
                      <input
                        type="number"
                        value={overrides[item.month]?.incoming_ccf ?? ''}
                        onChange={(e) => handleOverrideChange(item.month, 'incoming_ccf', e.target.value)}
                        placeholder={item.incoming_ccf}
                        style={{
                          width: 80,
                          padding: '2px 6px',
                          fontSize: 13,
                          border: hasOverrides ? '2px solid var(--saws-orange)' : '1px solid var(--saws-border)',
                          borderRadius: 4,
                          textAlign: 'right',
                          background: overrides[item.month]?.incoming_ccf ? '#fffaf2' : '#fff',
                        }}
                      />
                    </div>
                  </td>
                  <td className="billing-col">{formatMoney(item.billed_charge)}</td>
                  {/* Actual columns */}
                  <td className="actual-col">{effectiveActualSewer}</td>
                  <td className="actual-col">
                    <div className="override-field" style={{ display: 'inline' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={overrides[item.month]?.actual_charge ?? ''}
                        onChange={(e) => handleOverrideChange(item.month, 'actual_charge', e.target.value)}
                        placeholder={item.actual_charge?.toFixed(2)}
                        style={{
                          width: 100,
                          padding: '2px 6px',
                          fontSize: 13,
                          border: overrides[item.month]?.actual_charge ? '2px solid var(--saws-orange)' : '1px solid var(--saws-border)',
                          borderRadius: 4,
                          textAlign: 'right',
                          background: overrides[item.month]?.actual_charge ? '#fffaf2' : '#fff',
                        }}
                      />
                    </div>
                  </td>
                  <td className="actual-col">{item.basis}</td>
                  <td className="actual-col">{item.money_source}</td>
                  <td className={diffClass(diff)}>
                    {formatMoney(Math.abs(diff))} {diff > 0.005 ? 'over' : diff < -0.005 ? 'under' : ''}
                  </td>
                </tr>
              );
            })}

            {/* Totals Row */}
            <tr className="totals-row">
              <td style={{ textAlign: 'left' }}>TOTALS</td>
              <td className="billing-col">{totals.totalIncoming.toFixed(0)}</td>
              <td className="billing-col">{formatMoney(totals.totalBilled)}</td>
              <td className="actual-col">{totals.totalActualSewer.toFixed(0)}</td>
              <td className="actual-col">{formatMoney(totals.totalActualCharge)}</td>
              <td className="actual-col"></td>
              <td className="actual-col"></td>
              <td className={diffClass(totals.totalDifference)}>
                {formatMoney(Math.abs(totals.totalDifference))} {totals.totalDifference > 0.005 ? 'over' : totals.totalDifference < -0.005 ? 'under' : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="card-header">Assessment Summary</div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Total Billed</span>
            <span className="detail-value" style={{ fontSize: 20 }}>{formatMoney(totals.totalBilled)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Total Actual Charge</span>
            <span className="detail-value" style={{ fontSize: 20 }}>{formatMoney(totals.totalActualCharge)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Net Difference</span>
            <span className={`detail-value ${diffClass(totals.totalDifference)}`} style={{ fontSize: 20 }}>
              {formatMoney(Math.abs(totals.totalDifference))}
              {totals.totalDifference > 0.005 ? ' (customer owes)' : totals.totalDifference < -0.005 ? ' (credit due)' : ''}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Assessor</span>
            <span className="detail-value">{assessment.assessor || '--'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button className="btn btn-success btn-lg" onClick={handleAccept} disabled={saving}>
          Accept Assessment
        </button>
        <button className="btn btn-warning btn-lg" onClick={handleOverride} disabled={saving}>
          Save Overrides
        </button>
        <button className="btn btn-secondary btn-lg" onClick={handleProgress} disabled={saving}>
          Save Progress
        </button>
      </div>
    </div>
  );
}
