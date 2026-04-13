import { useState, useEffect } from 'react';
import { oncallService, departmentService } from '../services/api';

// BRD 7.1: On-Call Directory - Schedule showing what employee is on-call,
// contact info by department
export default function DirectoryPage() {
  const [oncallData, setOncallData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Load on-call data whenever department filter changes
  useEffect(() => {
    async function loadOnCall() {
      setLoading(true);
      setError(null);
      try {
        const deptId = selectedDept ? parseInt(selectedDept) : null;
        const res = await oncallService.getCurrent(deptId);
        setOncallData(res.data.data || []);
      } catch (err) {
        console.error('Failed to load on-call data:', err);
        setError('Failed to load on-call directory. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadOnCall();
  }, [selectedDept]);

  // Group on-call entries by department
  const groupedByDept = oncallData.reduce((acc, entry) => {
    const dept = entry.DepartmentName || 'Unknown';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(entry);
    return acc;
  }, {});

  const sortedDeptNames = Object.keys(groupedByDept).sort();

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatPhone(phone) {
    if (!phone) return 'N/A';
    // Format 10-digit numbers as (xxx) xxx-xxxx
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Current On-Call Staff</h2>
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={{ minWidth: '200px' }}
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.DepartmentID} value={dept.DepartmentID}>
                    {dept.DepartmentName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p style={{ marginTop: '12px' }}>Loading on-call directory...</p>
          </div>
        ) : sortedDeptNames.length === 0 ? (
          <div className="empty-state">
            <p>No on-call staff currently scheduled.</p>
          </div>
        ) : (
          sortedDeptNames.map((deptName) => (
            <div className="dept-card" key={deptName}>
              <div className="dept-card-header">{deptName}</div>
              <div className="dept-card-body">
                {/* Column headers */}
                <div className="oncall-entry" style={{ borderBottom: '2px solid var(--saws-border)', fontWeight: 600, fontSize: '13px', color: 'var(--saws-navy)' }}>
                  <span>Employee</span>
                  <span>Phone</span>
                  <span>Email</span>
                  <span>On-Call Period</span>
                </div>
                {groupedByDept[deptName].map((entry) => (
                  <div className="oncall-entry" key={entry.AssignmentID}>
                    <span className="oncall-name">
                      {entry.FirstName} {entry.LastName}
                    </span>
                    <span className="oncall-phone">
                      {formatPhone(entry.Phone)}
                    </span>
                    <span className="oncall-email">
                      {entry.Email || 'N/A'}
                    </span>
                    <span className="oncall-dates">
                      {formatDate(entry.StartDate)} - {formatDate(entry.EndDate)}
                      {entry.Notes && (
                        <span title={entry.Notes} style={{ marginLeft: '6px', cursor: 'help', color: 'var(--saws-blue)' }}>
                          [note]
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
