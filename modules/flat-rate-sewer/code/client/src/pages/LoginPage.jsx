import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Already Signed In</h1>
          <p className="login-subtitle">You are logged in as {user.name}</p>
          <div style={{ marginBottom: 16 }}>
            <strong>AD Groups:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              {user.groups.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate('/')}>
            Go to Dashboard
          </button>
          <a href="http://localhost:3000" className="portal-link">
            Back to EZ Link Portal
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  const quickLogin = (addr) => {
    const result = login(addr, 'auto');
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">SAWS Flat Rate Sewer</h1>
        <p className="login-subtitle">Sign in with your SAWS credentials</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@saws.org"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="any password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Sign In
          </button>
        </form>

        <div className="login-hint">
          <strong>Prototype Accounts:</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => quickLogin('admin@saws.org')}
              style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#0078AE', padding: 0, fontSize: 12 }}
            >
              admin@saws.org / admin (Admin + User)
            </button>
            <button
              type="button"
              onClick={() => quickLogin('user@saws.org')}
              style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#0078AE', padding: 0, fontSize: 12 }}
            >
              user@saws.org / user (User)
            </button>
            <button
              type="button"
              onClick={() => quickLogin('readonly@saws.org')}
              style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#0078AE', padding: 0, fontSize: 12 }}
            >
              readonly@saws.org / readonly (Read Only)
            </button>
          </div>
        </div>

        <a href="http://localhost:3000" className="portal-link">
          Back to EZ Link Portal
        </a>
      </div>
    </div>
  );
}
