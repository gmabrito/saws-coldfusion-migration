import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PURPOSES = [
  { value: 'after-hours duty',   label: 'After-Hours Duty' },
  { value: 'on-call',            label: 'On-Call' },
  { value: 'job site',           label: 'Job Site' },
  { value: 'emergency response', label: 'Emergency Response' },
  { value: 'other',              label: 'Other' },
];

const STUB_VEHICLES = [
  { id: 1, name: '2023 Ford F-150',     plate: 'F-150-01',  type: 'Pickup',  year: 2023 },
  { id: 2, name: '2022 RAM 1500',        plate: 'R-001',     type: 'Pickup',  year: 2022 },
  { id: 3, name: '2021 Chevy Silverado', plate: 'S-003',     type: 'Pickup',  year: 2021 },
  { id: 4, name: '2022 Ford Ranger',     plate: 'R-002',     type: 'Compact', year: 2022 },
  { id: 5, name: '2023 Ford F-250',      plate: 'F-250-02',  type: 'Heavy',   year: 2023 },
  { id: 6, name: '2023 Toyota Tacoma',   plate: 'T-001',     type: 'Compact', year: 2023 },
];

const today = new Date().toISOString().slice(0, 10);

export default function NewRequestPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    vehicle_id: '',
    checkout_date: today,
    return_date: today,
    purpose: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('/api/vehicles/available')
      .then((res) => setVehicles(res.data))
      .catch(() => setVehicles(STUB_VEHICLES));
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.vehicle_id || !form.purpose) {
      setError('Please select a vehicle and purpose.');
      return;
    }

    const selected = vehicles.find((v) => String(v.id) === String(form.vehicle_id));

    setSubmitting(true);
    try {
      await axios.post('/api/checkouts', {
        vehicle_id: form.vehicle_id,
        vehicle_name: selected?.name || '',
        vehicle_plate: selected?.plate || '',
        checkout_date: form.checkout_date,
        return_date: form.return_date,
        purpose: form.purpose,
        notes: form.notes,
      });
      navigate('/my-requests');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>New Take-Home Request</h1>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="vehicle_id">Vehicle</label>
            <select
              id="vehicle_id"
              name="vehicle_id"
              value={form.vehicle_id}
              onChange={handleChange}
              required
            >
              <option value="">— Select an available vehicle —</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.plate}) — {v.type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="checkout_date">Checkout Date</label>
              <input
                type="date"
                id="checkout_date"
                name="checkout_date"
                value={form.checkout_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="return_date">Return Date</label>
              <input
                type="date"
                id="return_date"
                name="return_date"
                value={form.return_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="purpose">Purpose</label>
            <select
              id="purpose"
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              required
            >
              <option value="">— Select purpose —</option>
              {PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              placeholder="Provide any additional details about this request..."
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
