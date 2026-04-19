import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ThemeToggle } from '@saws/ui-shell';

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    window.location.href = 'http://localhost:3000';
  }

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <a href="http://localhost:3000" className="portal-back">&#9664; Portal</a>
          <span>SAWS SITREP</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className="role-badge admin">{user?.role || 'eoc_staff'}</span>
          <ThemeToggle />
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/sitrep/new">New SITREP</NavLink>
        {isAdmin && <NavLink to="/admin">Admin</NavLink>}
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
