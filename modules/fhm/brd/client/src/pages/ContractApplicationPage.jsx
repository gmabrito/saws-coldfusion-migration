import { useState } from 'react';
import { Link } from 'react-router-dom';
import { contractService } from '../services/api';

export default function ContractApplicationPage() {
  const [form, setForm] = useState({
    applicantName: '', businessName: '', email: '', phone: '',
    meterSize: '', meterLocation: '', projectDescription: '', estimatedDuration: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await contractService.apply(form);
      setSuccess(data.message);
      setForm({
        applicantName: '', businessName: '', email: '', phone: '',
        meterSize: '', meterLocation: '', projectDescription: '', estimatedDuration: '',
      });
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className="page" style={{ maxWidth: '640px', width: '100%' }}>
        <h2>Fire Hydrant Meter Application</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Apply for a fire hydrant meter contract with SAWS. You will receive an email notification when your application is reviewed.
        </p>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="applicantName">Applicant Name *</label>
              <input id="applicantName" name="applicantName" value={form.applicantName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="businessName">Business Name *</label>
              <input id="businessName" name="businessName" value={form.businessName} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone *</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="meterSize">Meter Size *</label>
              <select id="meterSize" name="meterSize" value={form.meterSize} onChange={handleChange} required>
                <option value="">Select size</option>
                <option value='3/4"'>3/4"</option>
                <option value='1"'>1"</option>
                <option value='1.5"'>1.5"</option>
                <option value='2"'>2"</option>
                <option value='3"'>3"</option>
                <option value='4"'>4"</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="estimatedDuration">Estimated Duration *</label>
              <input id="estimatedDuration" name="estimatedDuration" value={form.estimatedDuration} onChange={handleChange} placeholder="e.g., 6 months" required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="meterLocation">Meter Location *</label>
            <input id="meterLocation" name="meterLocation" value={form.meterLocation} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="projectDescription">Project Description *</label>
            <textarea id="projectDescription" name="projectDescription" value={form.projectDescription} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
        <p className="auth-link" style={{ marginTop: '20px' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
