import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

// NOTE: Post-PoC — restore group-conditional admin nav once AD groups are
// provisioned (SAWS-AquaAI-Admin). During PoC all authenticated users
// see all nav items.

export default function Layout() {
  const { user } = useAuth();

  return (
    <>
      <header className="app-header" style={{ background: '#00A344' }}>
        <div className="brand">
          <a href="http://localhost:3000" className="portal-back">&#9664; Portal</a>
          <span>AquaAI</span>
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
        <NavLink to="/usage">Usage</NavLink>
        <NavLink to="/models">Models</NavLink>
        <NavLink to="/admin/budget">Budget</NavLink>
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
