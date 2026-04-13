import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      await login(username, password);
      navigate('/');
    } catch {
      // Error is set in AuthContext
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>SAWS EZ Link</h1>
        <p className="login-subtitle">Records Storage Transmittal</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '12px', background: '#f8f9fa', borderRadius: '4px', fontSize: '12px', color: '#6c757d' }}>
          <strong>Prototype Accounts:</strong><br />
          admin / password - Records Admin<br />
          records / password - Records Clerk<br />
          user / password - Department User
        </div>
      </div>
    </div>
  );
}
