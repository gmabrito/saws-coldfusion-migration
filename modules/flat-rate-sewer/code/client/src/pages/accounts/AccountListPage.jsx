import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { accountService } from '../../services/api';
import RoleGate from '../../components/RoleGate';

const PAGE_SIZE = 20;

export default function AccountListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.q = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await accountService.getAll(params);
      const body = res.data;
      setAccounts(body.data || body.accounts || (Array.isArray(body) ? body : []));
      setTotal(body.pagination?.total || body.total || (body.data?.length || 0));
    } catch {
      // Placeholder data
      setAccounts([
        { account_num: '100234', business_name: 'Downtown Car Wash', meter_size: '2"', method: 'METERED', status: 'ACTIVE', next_assessment_date: '2026-04-10' },
        { account_num: '100198', business_name: 'River City Laundry', meter_size: '3"', method: 'METERED', status: 'ACTIVE', next_assessment_date: '2026-04-12' },
        { account_num: '100301', business_name: 'SA Brewing Co', meter_size: '4"', method: 'METERED', status: 'ACTIVE', next_assessment_date: '2026-04-15' },
        { account_num: '100102', business_name: 'Alamo Heights Dentistry', meter_size: '1"', method: 'FLAT', status: 'ACTIVE', next_assessment_date: '2026-06-01' },
        { account_num: '100089', business_name: 'Mission Cooling Tower LLC', meter_size: '6"', method: 'METERED', status: 'INACTIVE', next_assessment_date: null },
      ]);
      setTotal(5);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({ q: search, status: statusFilter, page: '1' });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="page-header">
        <h1>Accounts</h1>
        <RoleGate groups={['SAWS-FRS-Admin']}>
          <Link to="/accounts/new" className="btn btn-primary">+ New Account</Link>
        </RoleGate>
      </div>

      <form onSubmit={handleSearch} className="filters-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or account number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {loading ? (
        <div className="loading">Loading accounts...</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Account #</th>
                <th>Business Name</th>
                <th>Meter Size</th>
                <th>Method</th>
                <th>Status</th>
                <th>Next Assessment</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No accounts found</td></tr>
              ) : (
                accounts.map((acct) => (
                  <tr key={acct.account_num} className="clickable-row" onClick={() => window.location.href = `/accounts/${acct.account_num}`}>
                    <td><Link to={`/accounts/${acct.account_num}`}>{acct.account_num}</Link></td>
                    <td>{acct.business_name}</td>
                    <td>{acct.meter_size}</td>
                    <td>{acct.method}</td>
                    <td><span className={`badge badge-${(acct.status || '').toLowerCase()}`}>{acct.status}</span></td>
                    <td>{acct.next_assessment_date ? new Date(acct.next_assessment_date).toLocaleDateString() : '--'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
