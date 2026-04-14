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
          <a href={PORTAL_URL} className="portal-back" title="Back to EZ Link Portal">&#9664; Portal</a>
          <Link to="/" className="logo">
            SAWS HR
          </Link>
          {user && (
            <nav className="nav">
              <Link to="/jobs">Job Listings</Link>
              <Link to="/inactive-directory">Inactive Directory</Link>
              {isAdmin && <Link to="/jobs/new" className="nav-admin-link">Post Job</Link>}
              {isAdmin && <Link to="/email-preview" className="nav-admin-link">Email Preview</Link>}
              <span className="user-name">{user.name || user.email}</span>
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
