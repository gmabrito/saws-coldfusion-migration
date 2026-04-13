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
            SAWS Utility Maps
          </Link>
          {user && (
            <nav className="nav">
              <Link to="/maps">All Maps</Link>
              {isAdmin && <Link to="/maps/new" className="nav-admin-link">Add Map</Link>}
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
