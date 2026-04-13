import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Sign In</h2>
        <p className="subtitle">SAWS Finance - Fire Hydrant Meter</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="any password" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '6px', fontSize: '13px', color: '#666' }}>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>Prototype Accounts:</p>
          <p><code style={{ background: '#e0f2fe', padding: '1px 5px', borderRadius: '3px', color: '#0078AE' }}>admin@saws.org</code> - Admin (approve contracts)</p>
          <p><code style={{ background: '#e0f2fe', padding: '1px 5px', borderRadius: '3px', color: '#0078AE' }}>user@saws.org</code> - SAWS employee</p>
          <p><code style={{ background: '#e0f2fe', padding: '1px 5px', borderRadius: '3px', color: '#0078AE' }}>vendor@example.com</code> - External vendor</p>
          <p style={{ marginTop: '4px', fontStyle: 'italic' }}>Any password works</p>
        </div>
        <p className="auth-link">
          Need a fire hydrant meter? <Link to="/apply">Apply here</Link>
        </p>
        <p className="auth-link" style={{ marginTop: '8px' }}>
          <a href="http://localhost:3000" style={{ color: '#0078AE' }}>&#9664; Back to EZ Link Portal</a>
        </p>
      </div>
    </div>
  );
}
