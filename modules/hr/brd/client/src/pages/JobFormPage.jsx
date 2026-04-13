import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService } from '../services/api';

// Ref: BRD 6.1 - "All jobs listed are entered manually"
// Admin create/edit job form
export default function JobFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    department: '',
    jobType: 'Internal',
    requirements: '',
    salaryRange: '',
    expirationDate: '',
    status: 'Active',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEdit) loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const { data } = await jobService.getById(id);
      setForm({
        title: data.Title || '',
        description: data.Description || '',
        department: data.Department || '',
        jobType: data.JobType || 'Internal',
        requirements: data.Requirements || '',
        salaryRange: data.SalaryRange || '',
        expirationDate: data.ExpirationDate ? data.ExpirationDate.split('T')[0] : '',
        status: data.Status || 'Active',
      });
    } catch (err) {
      setError('Failed to load job listing');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.description.trim()) errors.description = 'Description is required';
    if (!form.department.trim()) errors.department = 'Department is required';
    if (!['Internal', 'External'].includes(form.jobType)) errors.jobType = 'Select a valid job type';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setError('');
    setSaving(true);

    try {
      const payload = {
        ...form,
        expirationDate: form.expirationDate || null,
      };

      if (isEdit) {
        await jobService.update(id, payload);
      } else {
        await jobService.create(payload);
      }
      navigate('/jobs');
    } catch (err) {
      const msg = err.response?.data?.errors
        ? err.response.data.errors.map((e) => e.msg).join(', ')
        : err.response?.data?.error || 'Failed to save job listing';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading job listing...</div>;

  return (
    <div className="page">
      <h2>{isEdit ? 'Edit Job Listing' : 'Post New Job Listing'}</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title" name="title" value={form.title}
            onChange={handleChange} placeholder="e.g. Water Treatment Plant Operator"
          />
          {fieldErrors.title && <small style={{ color: '#dc3545' }}>{fieldErrors.title}</small>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="department">Department *</label>
            <input
              id="department" name="department" value={form.department}
              onChange={handleChange} placeholder="e.g. Operations"
            />
            {fieldErrors.department && <small style={{ color: '#dc3545' }}>{fieldErrors.department}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="jobType">Position Type *</label>
            <select id="jobType" name="jobType" value={form.jobType} onChange={handleChange}>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
            {fieldErrors.jobType && <small style={{ color: '#dc3545' }}>{fieldErrors.jobType}</small>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description" name="description" value={form.description}
            onChange={handleChange} rows={6}
            placeholder="Full job description including responsibilities and duties"
          />
          {fieldErrors.description && <small style={{ color: '#dc3545' }}>{fieldErrors.description}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="requirements">Requirements</label>
          <textarea
            id="requirements" name="requirements" value={form.requirements}
            onChange={handleChange} rows={4}
            placeholder="Education, experience, certifications, etc."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="salaryRange">Salary Range</label>
            <input
              id="salaryRange" name="salaryRange" value={form.salaryRange}
              onChange={handleChange} placeholder="e.g. $45,000 - $60,000"
            />
          </div>
          <div className="form-group">
            <label htmlFor="expirationDate">Expiration Date</label>
            <input
              id="expirationDate" name="expirationDate" type="date"
              value={form.expirationDate} onChange={handleChange}
            />
          </div>
        </div>

        {isEdit && (
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Listing' : 'Post Listing')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/jobs')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
