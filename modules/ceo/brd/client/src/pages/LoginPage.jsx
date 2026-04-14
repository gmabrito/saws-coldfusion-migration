import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { authService } from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.username.trim() || !form.password.trim()) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.login(form.username, form.password);
      login(data.token, data.user);
      navigate('/board-agendas');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>SAWS CEO Module</h2>
        <p className="subtitle">Board Management System Login</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-link">
          <Link to="/board-agendas">View public board agendas</Link>
        </div>

        <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0 }}>
          <strong>Dev credentials:</strong> admin/password, staff/password, viewer/password
        </div>
        <p className="auth-link" style={{ marginTop: '8px' }}>
          <a href="http://localhost:3000" style={{ color: '#0078AE' }}>&#9664; Back to EZ Link Portal</a>
        </p>
      </div>
    </div>
  );
}
