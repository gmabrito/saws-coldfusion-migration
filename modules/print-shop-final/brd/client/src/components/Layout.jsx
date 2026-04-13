import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            SAWS Print Shop
          </Link>
          {user && (
            <nav className="nav">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/jobs">All Jobs</Link>
              <Link to="/jobs/new">New Request</Link>
              <span className="user-name">{user.displayName || user.email}</span>
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
