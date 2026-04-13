import { useState } from 'react';
import PortalHeader from './components/PortalHeader';
import PortalGrid from './components/PortalGrid';

// Simulated user roles for the prototype
const MOCK_USERS = {
  admin: {
    username: 'admin',
    displayName: 'Admin User',
    roles: ['admin', 'ezlink', 'insider'],
    apps: 'all',
  },
  vendor: {
    username: 'vendor',
    displayName: 'Vendor User',
    roles: ['ezlink'],
    apps: ['contracting-vendors', 'contracting-solicitations', 'my-profile'],
  },
  employee: {
    username: 'employee',
    displayName: 'SAWS Employee',
    roles: ['ezlink', 'insider'],
    apps: 'all',
  },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const mockUser = MOCK_USERS[loginForm.username];
    if (mockUser) {
      setUser(mockUser);
      setError('');
    } else {
      setError('Invalid credentials. Try: admin, vendor, or employee');
    }
  };

  const handleLogout = () => {
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
            <button type="submit" className="btn btn-primary btn-block">Sign In</button>
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
