import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../services/api';

// Ref: BRD 6.1 - Inactive Employee Directory
// "All the inactive employee's information (to include their photo) is centralized within this area."
export default function InactiveDirectoryPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [page, department]);

  const loadDepartments = async () => {
    try {
      const { data } = await employeeService.getDepartments();
      setDepartments(data);
    } catch (err) {
      // non-critical, ignore
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (department) params.department = department;
      const { data } = await employeeService.getInactive(params);
      setEmployees(data.employees);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to load inactive employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadEmployees();
  };

  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value);
    setPage(1);
  };

  const openDetail = async (empId) => {
    try {
      setDetailLoading(true);
      const { data } = await employeeService.getInactiveById(empId);
      setSelectedEmployee(data);
    } catch (err) {
      setError('Failed to load employee details');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => setSelectedEmployee(null);

  const getInitials = (first, last) => {
    return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="page">
      <h2>Inactive Employee Directory</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div className="form-group">
            <label>Search by Name / Email</label>
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Enter name or email..."
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
        <div className="form-group">
          <label>Department</label>
          <select value={department} onChange={handleDepartmentChange}>
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>
          {pagination.total} inactive employee{pagination.total !== 1 ? 's' : ''} found
        </p>
      </div>

      {loading ? (
        <div className="loading">Loading inactive employees...</div>
      ) : employees.length === 0 ? (
        <div className="alert alert-info">No inactive employees found matching your criteria.</div>
      ) : (
        <>
          <div className="employee-grid">
            {employees.map((emp) => (
              <div key={emp.EmployeeID} className="employee-card" onClick={() => openDetail(emp.EmployeeID)}>
                {emp.PhotoURL ? (
                  <img src={emp.PhotoURL} alt={`${emp.FirstName} ${emp.LastName}`} className="employee-photo" />
                ) : (
                  <div className="employee-photo-placeholder">
                    {getInitials(emp.FirstName, emp.LastName)}
                  </div>
                )}
                <h4>{emp.FirstName} {emp.LastName}</h4>
                <p>{emp.JobTitle || 'No title'}</p>
                <p>{emp.DepartmentName || 'No department'}</p>
                {emp.TerminationDate && (
                  <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    Separated: {formatDate(emp.TerminationDate)}
                  </p>
                )}
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span style={{ fontSize: 13, color: '#666' }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeDetail}>X</button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {selectedEmployee.PhotoURL ? (
                <img src={selectedEmployee.PhotoURL} alt={`${selectedEmployee.FirstName} ${selectedEmployee.LastName}`} className="employee-photo" />
              ) : (
                <div className="employee-photo-placeholder" style={{ margin: '0 auto' }}>
                  {getInitials(selectedEmployee.FirstName, selectedEmployee.LastName)}
                </div>
              )}
              <h3 style={{ marginTop: 8 }}>{selectedEmployee.FirstName} {selectedEmployee.LastName}</h3>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <div className="label">Job Title</div>
                <div className="value">{selectedEmployee.JobTitle || 'N/A'}</div>
              </div>
              <div className="detail-item">
                <div className="label">Department</div>
                <div className="value">{selectedEmployee.DepartmentName || 'N/A'}</div>
              </div>
              <div className="detail-item">
                <div className="label">Email</div>
                <div className="value">{selectedEmployee.Email || 'N/A'}</div>
              </div>
              <div className="detail-item">
                <div className="label">Phone</div>
                <div className="value">{selectedEmployee.Phone || 'N/A'}</div>
              </div>
              <div className="detail-item">
                <div className="label">Hire Date</div>
                <div className="value">{formatDate(selectedEmployee.HireDate)}</div>
              </div>
              <div className="detail-item">
                <div className="label">Separation Date</div>
                <div className="value">{formatDate(selectedEmployee.TerminationDate)}</div>
              </div>
            </div>

            {(selectedEmployee.Address || selectedEmployee.City) && (
              <>
                <h3 style={{ fontSize: 14, marginTop: 12 }}>Address</h3>
                <p style={{ fontSize: 14, color: '#666' }}>
                  {[selectedEmployee.Address, selectedEmployee.City, selectedEmployee.State, selectedEmployee.ZipCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: 'center' }}>
            <p>Loading employee details...</p>
          </div>
        </div>
      )}
    </div>
  );
}
