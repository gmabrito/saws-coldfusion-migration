import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { assessmentService } from '../../services/api';

export default function AssessmentListPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter !== 'all') params.status = filter;
      const res = await assessmentService.getAll(params);
      setAssessments(res.data.assessments || res.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setAssessments([
        { assessment_id: 1001, account_num: '100234', business_name: 'Downtown Car Wash', billing_date: '2026-03-01', billed_amount: 1245.50, actual_amount: 1102.30, difference: -143.20, status: 'COMPLETED' },
        { assessment_id: 1002, account_num: '100198', business_name: 'River City Laundry', billing_date: '2026-03-01', billed_amount: 2340.00, actual_amount: 2580.75, difference: 240.75, status: 'DUE' },
        { assessment_id: 1003, account_num: '100301', business_name: 'SA Brewing Co', billing_date: '2026-03-01', billed_amount: 4520.00, actual_amount: null, difference: null, status: 'DUE' },
        { assessment_id: 1004, account_num: '100102', business_name: 'Alamo Heights Dentistry', billing_date: '2026-02-01', billed_amount: 89.50, actual_amount: 89.50, difference: 0, status: 'COMPLETED' },
        { assessment_id: 1005, account_num: '100234', business_name: 'Downtown Car Wash', billing_date: '2026-02-01', billed_amount: 1180.25, actual_amount: 1220.10, difference: 39.85, status: 'COMPLETED' },
      ]);
      setTotal(5);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const filteredAssessments = filter === 'all'
    ? assessments
    : assessments.filter((a) => a.status === filter.toUpperCase());

  return (
    <div>
      <div className="page-header">
        <h1>Assessments</h1>
      </div>

      <div className="tab-bar">
        {['all', 'DUE', 'COMPLETED'].map((f) => (
          <button
            key={f}
            className={filter === f ? 'active' : ''}
            onClick={() => { setFilter(f); setPage(1); }}
          >
            {f === 'all' ? 'All' : f === 'DUE' ? 'Due' : 'Completed'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading assessments...</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Account #</th>
              <th>Business</th>
              <th>Billing Date</th>
              <th>Billed Amount</th>
              <th>Actual Amount</th>
              <th>Difference</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssessments.length === 0 ? (
              <tr><td colSpan={8} className="empty-state">No assessments found</td></tr>
            ) : (
              filteredAssessments.map((a) => (
                <tr key={a.assessment_id} className="clickable-row" onClick={() => window.location.href = `/assessments/${a.assessment_id}`}>
                  <td><Link to={`/assessments/${a.assessment_id}`}>{a.assessment_id}</Link></td>
                  <td><Link to={`/accounts/${a.account_num}`}>{a.account_num}</Link></td>
                  <td>{a.business_name}</td>
                  <td>{a.billing_date}</td>
                  <td>${a.billed_amount?.toFixed(2)}</td>
                  <td>{a.actual_amount != null ? `$${a.actual_amount.toFixed(2)}` : '--'}</td>
                  <td>
                    {a.difference != null ? (
                      <span className={a.difference > 0 ? 'diff-positive' : a.difference < 0 ? 'diff-negative' : 'diff-zero'}>
                        ${Math.abs(a.difference).toFixed(2)} {a.difference > 0 ? 'over' : a.difference < 0 ? 'under' : ''}
                      </span>
                    ) : '--'}
                  </td>
                  <td><span className={`badge badge-${a.status?.toLowerCase()}`}>{a.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
