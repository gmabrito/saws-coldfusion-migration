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
            SAWS Finance - Fire Hydrant Meter
          </Link>
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
