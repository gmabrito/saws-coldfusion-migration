import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

// NOTE: Post-PoC — restore group-conditional admin nav once AD groups are
// provisioned (SAWS-AquaHawk-Admin). During PoC all authenticated users
// see all nav items.

export default function Layout() {
  const { user } = useAuth();

  return (
    <>
      <header className="app-header" style={{ background: '#D32F2F' }}>
        <div className="brand">
          <a href="http://localhost:3000" className="portal-back">&#9664; Portal</a>
          <span>AquaHawk</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name || user?.email}</span>
          <span className="role-badge">SAWS</span>
          <a href="/.auth/logout" className="logout-btn" style={{ textDecoration: 'none' }}>
            Logout
          </a>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/events">Events</NavLink>
        <NavLink to="/modules">Modules</NavLink>
        <NavLink to="/admin/config">Config</NavLink>
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
