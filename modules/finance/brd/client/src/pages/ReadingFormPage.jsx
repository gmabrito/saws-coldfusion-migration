import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { readingService, contractService } from '../services/api';

export default function ReadingFormPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [form, setForm] = useState({
    contractId: '', currentReading: '', previousReading: '',
    meterLocation: '', reportedBy: user?.contact_name || '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const { data } = await contractService.getAll({ status: 'Approved' });
      setContracts(data);
    } catch {
      // contracts will be empty
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleContractChange = (e) => {
    const contractId = e.target.value;
    const selected = contracts.find((c) => c.ContractID === parseInt(contractId));
    setForm((prev) => ({
      ...prev,
      contractId,
      meterLocation: selected?.MeterLocation || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await readingService.submit(form);
      setSuccess(data.message);
      setForm({
        contractId: '', currentReading: '', previousReading: '',
        meterLocation: '', reportedBy: user?.contact_name || '',
      });
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const usage = form.currentReading && form.previousReading
    ? (parseFloat(form.currentReading) - parseFloat(form.previousReading)).toFixed(2)
    : '';

  return (
    <div className="page">
      <h2>Submit Fire Hydrant Meter Reading</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Readings are due by the 20th of each month.
      </p>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="contractId">Select Contract *</label>
          <select id="contractId" name="contractId" value={form.contractId} onChange={handleContractChange} required>
            <option value="">Select a contract</option>
            {contracts.map((c) => (
              <option key={c.ContractID} value={c.ContractID}>
                #{c.ContractID} - {c.BusinessName} ({c.MeterSize})
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="currentReading">Current Reading *</label>
            <input id="currentReading" name="currentReading" type="number" step="0.01" value={form.currentReading} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="previousReading">Previous Reading *</label>
            <input id="previousReading" name="previousReading" type="number" step="0.01" value={form.previousReading} onChange={handleChange} required />
          </div>
        </div>

        {usage && (
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            Calculated Usage: <strong>{usage}</strong> gallons
          </div>
        )}

        <div className="form-group">
          <label htmlFor="meterLocation">Meter Location *</label>
          <input id="meterLocation" name="meterLocation" value={form.meterLocation} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="reportedBy">Reported By *</label>
          <input id="reportedBy" name="reportedBy" value={form.reportedBy} onChange={handleChange} required />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Reading'}
        </button>
      </form>
    </div>
  );
}
