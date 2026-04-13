import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PORTAL_URL = 'http://localhost:3000';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    window.location.href = PORTAL_URL;
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a href={PORTAL_URL} className="portal-back" title="Back to EZ Link Portal">
              &#9664; Portal
            </a>
            <Link to="/" className="logo">
              SAWS Finance - Fire Hydrant Meter
            </Link>
          </div>
          {user && (
            <nav className="nav">
              <Link to="/contracts">Contracts</Link>
              <Link to="/readings">Submit Reading</Link>
              <Link to="/reports">Reports</Link>
              {isAdmin && <Link to="/admin/contracts" className="nav-admin-link">Admin</Link>}
              <span className="user-name">{user.contact_name || user.email}</span>
              <button onClick={handleLogout} className="btn-link">Logout</button>
            </nav>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
