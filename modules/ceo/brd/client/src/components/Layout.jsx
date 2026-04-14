import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PORTAL_URL = 'http://localhost:3000';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    window.location.href = PORTAL_URL;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <a href={PORTAL_URL} className="portal-back" title="Back to EZ Link Portal">&#9664; Portal</a>
          <Link to="/" className="logo">SAWS CEO - Board Management</Link>
          <nav className="nav">
            <NavLink to="/board-agendas">Board Agendas</NavLink>
            <NavLink to="/committee-agendas">Committee Agendas</NavLink>
            <NavLink to="/subscribe">Subscribe</NavLink>
            {user ? (
              <>
                <NavLink to="/agendas/new" className="nav-admin-link">New Agenda</NavLink>
                <span className="user-name">{user.name}</span>
                <button className="btn-link" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <NavLink to="/login">Login</NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
