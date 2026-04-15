import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { reportService } from '../../services/api';

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

export default function AssessmentReportPage() {
  const { accountNum } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [accountNum]);

  async function loadReport() {
    try {
      const res = await reportService.getAssessmentReport(accountNum);
      setReport(res.data);
    } catch {
      // Placeholder matching legacy PDF layout
      setReport({
        account: {
          account_num: accountNum,
          business_name: 'Downtown Car Wash',
          contact_name: 'John Smith',
          address: '456 Commerce St, San Antonio, TX 78205',
          phone: '(210) 555-0100',
          meter_size: '2"',
          method: 'METERED',
          billing_basis: 'CONSUMPTION',
        },
        assessment: {
          assessment_id: 1001,
          billing_period_start: '2025-04-01',
          billing_period_end: '2026-03-31',
          assessor: 'FRS Administrator',
          assessor_email: 'admin@saws.org',
          completed_date: '2026-04-15',
          status: 'COMPLETED',
        },
        lineItems: [
          { billing_date: '04/2025', incoming_ccf: 128, billed_charge: 1245.50, actual_sewer_ccf: 112, actual_charge: 1102.30, basis: 'CONS', money_source: 'METER', difference: -143.20 },
          { billing_date: '05/2025', incoming_ccf: 135, billed_charge: 1310.25, actual_sewer_ccf: 120, actual_charge: 1175.40, basis: 'CONS', money_source: 'METER', difference: -134.85 },
          { billing_date: '06/2025', incoming_ccf: 142, billed_charge: 1378.10, actual_sewer_ccf: 130, actual_charge: 1273.50, basis: 'CONS', money_source: 'METER', difference: -104.60 },
          { billing_date: '07/2025', incoming_ccf: 155, billed_charge: 1504.25, actual_sewer_ccf: 140, actual_charge: 1371.60, basis: 'CONS', money_source: 'METER', difference: -132.65 },
          { billing_date: '08/2025', incoming_ccf: 160, billed_charge: 1552.80, actual_sewer_ccf: 145, actual_charge: 1420.50, basis: 'CONS', money_source: 'METER', difference: -132.30 },
          { billing_date: '09/2025', incoming_ccf: 148, billed_charge: 1436.04, actual_sewer_ccf: 132, actual_charge: 1293.12, basis: 'CONS', money_source: 'METER', difference: -142.92 },
          { billing_date: '10/2025', incoming_ccf: 130, billed_charge: 1261.70, actual_sewer_ccf: 115, actual_charge: 1128.75, basis: 'CONS', money_source: 'METER', difference: -132.95 },
          { billing_date: '11/2025', incoming_ccf: 118, billed_charge: 1145.22, actual_sewer_ccf: 105, actual_charge: 1029.00, basis: 'CONS', money_source: 'METER', difference: -116.22 },
          { billing_date: '12/2025', incoming_ccf: 112, billed_charge: 1086.96, actual_sewer_ccf: 100, actual_charge: 980.00, basis: 'CONS', money_source: 'METER', difference: -106.96 },
          { billing_date: '01/2026', incoming_ccf: 105, billed_charge: 1018.55, actual_sewer_ccf: 92, actual_charge: 901.60, basis: 'CONS', money_source: 'METER', difference: -116.95 },
          { billing_date: '02/2026', incoming_ccf: 110, billed_charge: 1067.08, actual_sewer_ccf: 98, actual_charge: 960.40, basis: 'CONS', money_source: 'METER', difference: -106.68 },
          { billing_date: '03/2026', incoming_ccf: 120, billed_charge: 1339.55, actual_sewer_ccf: 108, actual_charge: 1845.28, basis: 'CONS', money_source: 'METER', difference: 505.73 },
        ],
        totals: {
          total_incoming: 1563,
          total_billed: 14946.00,
          total_actual_sewer: 1397,
          total_actual_charge: 14481.45,
          total_difference: -464.55,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading report...</div>;
  if (!report) return <div className="alert alert-danger">Report not found.</div>;

  const { account, assessment, lineItems, totals } = report;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 8 }}>
        <h1>Flat Rate Sewer Assessment Report</h1>
        <button className="btn btn-primary" onClick={() => window.print()}>Print Report</button>
      </div>

      {/* Report Header - matches legacy PDF */}
      <div className="card" style={{ borderTop: '4px solid var(--saws-blue)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 style={{ color: 'var(--saws-navy)', margin: 0 }}>San Antonio Water System</h2>
          <h3 style={{ color: 'var(--saws-blue)', fontWeight: 400, margin: '4px 0' }}>Flat Rate Sewer Assessment</h3>
        </div>

        <div className="two-col">
          <div>
            <div className="detail-item" style={{ marginBottom: 8 }}>
              <span className="detail-label">Account Number</span>
              <span className="detail-value" style={{ fontWeight: 700 }}>{account.account_num}</span>
            </div>
            <div className="detail-item" style={{ marginBottom: 8 }}>
              <span className="detail-label">Business Name</span>
              <span className="detail-value">{account.business_name}</span>
            </div>
            <div className="detail-item" style={{ marginBottom: 8 }}>
              <span className="detail-label">Contact</span>
              <span className="detail-value">{account.contact_name}</span>
            </div>
            <div className="detail-item" style={{ marginBottom: 8 }}>
              <span className="detail-label">Address</span>
              <span className="detail-value">{account.address}</span>
            </div>
          </div>
          <div>
            <div className="detail-item" style={{ marginBottom: 8 }}>
              <span className="detail-label">Meter Size</span>
              <span className="detail-value">{account.meter_size}</span>
            </div>
            <div className="detail-item" style={{ marginBottom: 8 }}>
              <span className="detail-label">Method</span>
              <span className="detail-value">{account.method}</span>
            </div>
            <div className="detail-item" style={{ marginBottom: 8 }}>
              <span className="detail-label">Billing Period</span>
              <span className="detail-value">{assessment.billing_period_start} to {assessment.billing_period_end}</span>
            </div>
            <div className="detail-item" style={{ marginBottom: 8 }}>
              <span className="detail-label">Assessment Date</span>
              <span className="detail-value">{assessment.completed_date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Billing vs Actual Comparison - legacy PDF format */}
      <div className="card" style={{ overflowX: 'auto' }}>
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
            {lineItems.map((item, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'left', fontWeight: 500 }}>{item.billing_date}</td>
                <td className="billing-col">{item.incoming_ccf}</td>
                <td className="billing-col">{formatMoney(item.billed_charge)}</td>
                <td className="actual-col">{item.actual_sewer_ccf}</td>
                <td className="actual-col">{formatMoney(item.actual_charge)}</td>
                <td className="actual-col">{item.basis}</td>
                <td className="actual-col">{item.money_source}</td>
                <td className={diffClass(item.difference)}>
                  {formatMoney(Math.abs(item.difference))} {item.difference > 0.005 ? 'over' : item.difference < -0.005 ? 'under' : ''}
                </td>
              </tr>
            ))}

            <tr className="totals-row">
              <td style={{ textAlign: 'left' }}>TOTALS</td>
              <td className="billing-col">{totals.total_incoming}</td>
              <td className="billing-col">{formatMoney(totals.total_billed)}</td>
              <td className="actual-col">{totals.total_actual_sewer}</td>
              <td className="actual-col">{formatMoney(totals.total_actual_charge)}</td>
              <td className="actual-col"></td>
              <td className="actual-col"></td>
              <td className={diffClass(totals.total_difference)}>
                {formatMoney(Math.abs(totals.total_difference))} {totals.total_difference > 0.005 ? 'over' : totals.total_difference < -0.005 ? 'under' : ''}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary & Assessor */}
      <div className="card">
        <div className="two-col">
          <div>
            <h3 className="section-title">Assessment Result</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Total Billed</span>
                <span className="detail-value" style={{ fontSize: 18 }}>{formatMoney(totals.total_billed)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Total Actual</span>
                <span className="detail-value" style={{ fontSize: 18 }}>{formatMoney(totals.total_actual_charge)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Net Difference</span>
                <span className={`detail-value ${diffClass(totals.total_difference)}`} style={{ fontSize: 18, fontWeight: 700 }}>
                  {formatMoney(Math.abs(totals.total_difference))}
                  {totals.total_difference > 0.005 ? ' (customer owes)' : totals.total_difference < -0.005 ? ' (credit due)' : ''}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="section-title">Assessor Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Assessor</span>
                <span className="detail-value">{assessment.assessor}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{assessment.assessor_email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Completed</span>
                <span className="detail-value">{assessment.completed_date}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value">
                  <span className={`badge badge-${assessment.status?.toLowerCase()}`}>{assessment.status}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
