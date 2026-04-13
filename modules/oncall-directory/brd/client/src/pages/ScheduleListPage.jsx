import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { oncallService, departmentService } from '../services/api';

// BRD 7.2/7.3: Admin view of all scheduled on-call assignments with date filters
// BRD 7.3: Report Requirements - filterable schedule listing
export default function ScheduleListPage() {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    departmentId: '',
    startDate: '',
    endDate: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 0
  });

  // Load departments on mount
  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await departmentService.list();
        setDepartments(res.data.data || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    }
    loadDepartments();
  }, []);

  // Load assignments
  const loadAssignments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        pageSize: pagination.pageSize
      };
      if (filters.departmentId) params.departmentId = parseInt(filters.departmentId);
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await oncallService.getSchedule(params);
      setAssignments(res.data.data || []);
      setPagination(res.data.pagination || {
        page: 1,
        pageSize: 25,
        totalCount: 0,
        totalPages: 0
      });
    } catch (err) {
      console.error('Failed to load assignments:', err);
      setError('Failed to load schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  useEffect(() => {
    loadAssignments(1);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function clearFilters() {
    setFilters({ departmentId: '', startDate: '', endDate: '' });
  }

  async function handleDelete(assignmentId) {
    if (!window.confirm('Are you sure you want to delete this on-call assignment?')) {
      return;
    }

    try {
      await oncallService.delete(assignmentId);
      setSuccess('Assignment deleted successfully.');
      loadAssignments(pagination.page);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete assignment.');
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function getStatusBadge(startDate, endDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (now >= start && now <= end) {
      return <span className="badge badge-active">Active</span>;
    } else if (now < start) {
      return <span className="badge badge-upcoming">Upcoming</span>;
    } else {
      return <span className="badge badge-past">Past</span>;
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>On-Call Schedule</h2>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/schedule/new')}
          >
            + New Assignment
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* BRD 7.3: Report filters */}
        <div className="filter-bar">
          <div className="form-group">
            <label>Department</label>
            <select
              name="departmentId"
              value={filters.departmentId}
              onChange={handleFilterChange}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.DepartmentID} value={dept.DepartmentID}>
                  {dept.DepartmentName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group" style={{ alignSelf: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '12px' }}>Loading schedule...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <p>No on-call assignments found.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/admin/schedule/new')}
            >
              Create First Assignment
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Department</th>
                    <th>Employee</th>
                    <th>Phone</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.AssignmentID}>
                      <td>{getStatusBadge(a.StartDate, a.EndDate)}</td>
                      <td>{a.DepartmentName}</td>
                      <td>{a.FirstName} {a.LastName}</td>
                      <td>{a.Phone}</td>
                      <td>{formatDate(a.StartDate)}</td>
                      <td>{formatDate(a.EndDate)}</td>
                      <td>{a.Notes || '-'}</td>
                      <td>
                        <div className="actions-cell">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/admin/schedule/${a.AssignmentID}/edit`)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(a.AssignmentID)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => loadAssignments(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                </span>
                <button
                  onClick={() => loadAssignments(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
