import { useState } from 'react';
import { Link } from 'react-router-dom';
import { subscriberService } from '../services/api';

export default function SubscribePage() {
  const [form, setForm] = useState({ email: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!form.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!form.email.trim()) {
      setError('Email address is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await subscriberService.subscribe({
        email: form.email.trim(),
        fullName: form.fullName.trim()
      });
      setSuccess('You have been successfully subscribed to board meeting notifications!');
      setForm({ email: '', fullName: '' });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to subscribe';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="subscribe-page">
      <div className="subscribe-card">
        <h2>Board Meeting Notifications</h2>
        <p className="subtitle">
          Sign up to receive notifications about upcoming SAWS Board of Trustees meetings,
          including schedule changes and agenda publications.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                maxLength={255}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                maxLength={255}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Subscribing...' : 'Subscribe to Notifications'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <Link to="/board-agendas" className="btn btn-primary">View Board Agendas</Link>
          </div>
        )}

        <div className="auth-link" style={{ marginTop: 24 }}>
          <Link to="/board-agendas">View Board Meeting Agendas</Link>
        </div>
      </div>
    </div>
  );
}
