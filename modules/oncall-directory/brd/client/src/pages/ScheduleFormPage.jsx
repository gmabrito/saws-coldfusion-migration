import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { oncallService, departmentService, employeeService } from '../services/api';

// BRD 7.2: Admin form to assign on-call (select department, employee, start/end date, phone)
export default function ScheduleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    departmentId: '',
    employeeId: '',
    startDate: '',
    endDate: '',
    phone: '',
    notes: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // Load departments on mount
  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await departmentService.list();
        setDepartments(res.data.data || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
        setError('Failed to load departments.');
      }
    }
    loadDepartments();
  }, []);

  // Load employees when department changes
  useEffect(() => {
    if (!form.departmentId) {
      setEmployees([]);
      return;
    }

    async function loadEmployees() {
      try {
        const res = await employeeService.list(parseInt(form.departmentId));
        setEmployees(res.data.data || []);
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    }
    loadEmployees();
  }, [form.departmentId]);

  // Load existing assignment for edit mode
  useEffect(() => {
    if (!isEdit) return;

    async function loadAssignment() {
      setLoadingData(true);
      try {
        // Fetch the schedule and find our assignment by ID
        const res = await oncallService.getSchedule({ pageSize: 100 });
        const assignment = (res.data.data || []).find(
          (a) => a.AssignmentID === parseInt(id)
        );
        if (!assignment) {
          setError('Assignment not found.');
          return;
        }
        setForm({
          departmentId: String(assignment.DepartmentID),
          employeeId: String(assignment.EmployeeID),
          startDate: assignment.StartDate ? assignment.StartDate.split('T')[0] : '',
          endDate: assignment.EndDate ? assignment.EndDate.split('T')[0] : '',
          phone: assignment.Phone || '',
          notes: assignment.Notes || ''
        });
      } catch (err) {
        console.error('Failed to load assignment:', err);
        setError('Failed to load assignment for editing.');
      } finally {
        setLoadingData(false);
      }
    }
    loadAssignment();
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear employee if department changes
    if (name === 'departmentId') {
      setForm((prev) => ({ ...prev, [name]: value, employeeId: '' }));
    }

    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  }

  function validate() {
    const errors = {};
    if (!form.departmentId) errors.departmentId = 'Department is required.';
    if (!form.employeeId) errors.employeeId = 'Employee is required.';
    if (!form.startDate) errors.startDate = 'Start date is required.';
    if (!form.endDate) errors.endDate = 'End date is required.';
    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!/^[\d\s\-().+]+$/.test(form.phone)) {
      errors.phone = 'Invalid phone number format.';
    }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      errors.endDate = 'End date must be after start date.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        departmentId: parseInt(form.departmentId),
        employeeId: parseInt(form.employeeId),
        startDate: form.startDate,
        endDate: form.endDate,
        phone: form.phone.trim(),
        notes: form.notes.trim() || null
      };

      if (isEdit) {
        await oncallService.update(parseInt(id), payload);
        setSuccess('Assignment updated successfully.');
      } else {
        await oncallService.create(payload);
        setSuccess('Assignment created successfully.');
        // Reset form after create
        setForm({
          departmentId: '',
          employeeId: '',
          startDate: '',
          endDate: '',
          phone: '',
          notes: ''
        });
      }

      // Navigate back after a short delay
      setTimeout(() => navigate('/admin/schedule'), 1500);
    } catch (err) {
      const message = err.response?.data?.error
        || err.response?.data?.errors?.[0]?.msg
        || 'Failed to save assignment.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '12px' }}>Loading assignment...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>{isEdit ? 'Edit On-Call Assignment' : 'New On-Call Assignment'}</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="departmentId">Department *</label>
            <select
              id="departmentId"
              name="departmentId"
              value={form.departmentId}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept.DepartmentID} value={dept.DepartmentID}>
                  {dept.DepartmentName}
                </option>
              ))}
            </select>
            {fieldErrors.departmentId && (
              <span className="error-text">{fieldErrors.departmentId}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="employeeId">Employee *</label>
            <select
              id="employeeId"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              disabled={loading || !form.departmentId}
            >
              <option value="">
                {form.departmentId ? '-- Select Employee --' : '-- Select Department First --'}
              </option>
              {employees.map((emp) => (
                <option key={emp.EmployeeID} value={emp.EmployeeID}>
                  {emp.LastName}, {emp.FirstName}
                </option>
              ))}
            </select>
            {fieldErrors.employeeId && (
              <span className="error-text">{fieldErrors.employeeId}</span>
            )}
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              disabled={loading}
            />
            {fieldErrors.startDate && (
              <span className="error-text">{fieldErrors.startDate}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date *</label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              disabled={loading}
            />
            {fieldErrors.endDate && (
              <span className="error-text">{fieldErrors.endDate}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">On-Call Phone *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="(210) 555-1234"
              disabled={loading}
            />
            {fieldErrors.phone && (
              <span className="error-text">{fieldErrors.phone}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Optional notes about this on-call assignment"
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? (isEdit ? 'Updating...' : 'Creating...')
              : (isEdit ? 'Update Assignment' : 'Create Assignment')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/schedule')}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
