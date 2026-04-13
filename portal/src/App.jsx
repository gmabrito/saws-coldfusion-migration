import { useState, useEffect } from 'react';
import PortalHeader from './components/PortalHeader';
import PortalGrid from './components/PortalGrid';

// Maps portal usernames to module auth emails
const MOCK_USERS = {
  admin: {
    username: 'admin',
    displayName: 'Admin User',
    email: 'admin@saws.org',
    roles: ['admin', 'ezlink', 'insider'],
    apps: 'all',
  },
  vendor: {
    username: 'vendor',
    displayName: 'Vendor User',
    email: 'vendor@example.com',
    roles: ['ezlink'],
    apps: ['contracting-vendors', 'contracting-solicitations', 'my-profile'],
  },
  employee: {
    username: 'employee',
    displayName: 'SAWS Employee',
    email: 'user@saws.org',
    roles: ['ezlink', 'insider'],
    apps: 'all',
  },
};

// Auth API endpoint (Finance server handles auth for the prototype)
const AUTH_API = 'http://localhost:3001/api/auth';

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('portal_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep token in localStorage for SSO
  const token = localStorage.getItem('sso_token');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const mockUser = MOCK_USERS[loginForm.username];
    if (!mockUser) {
      setError('Invalid credentials. Try: admin, vendor, or employee');
      setLoading(false);
      return;
    }

    try {
      // Get a real JWT from the auth server
      const res = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mockUser.email, password: 'sso' }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Store SSO token and user info
      localStorage.setItem('sso_token', data.token);
      localStorage.setItem('sso_user', JSON.stringify(data.user));
      localStorage.setItem('portal_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (err) {
      // If auth server isn't running, still allow portal login
      console.warn('Auth server not available, using local-only login:', err.message);
      localStorage.setItem('portal_user', JSON.stringify(mockUser));
      setUser(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sso_token');
    localStorage.removeItem('sso_user');
    localStorage.removeItem('portal_user');
    setUser(null);
    setLoginForm({ username: '', password: '' });
  };

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <img src="https://www.saws.org/wp-content/themes/theme-developer/assets/saws-logo-login.svg" alt="SAWS" crossOrigin="anonymous" onError={(e) => { e.target.style.display = 'none'; }} />
            <h1>EZLink Applications</h1>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="Enter username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="login-hint">
            <p><strong>Prototype Accounts:</strong></p>
            <p><code>admin</code> - Full access to all apps</p>
            <p><code>employee</code> - Internal SAWS employee</p>
            <p><code>vendor</code> - External vendor (limited access)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal">
      <PortalHeader user={user} onLogout={handleLogout} />
      <PortalGrid user={user} />
    </div>
  );
}
