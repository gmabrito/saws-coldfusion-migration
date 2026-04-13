import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
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
