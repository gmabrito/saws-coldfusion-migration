import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { ThemeToggle } from '@saws/ui-shell';

// NOTE: Post-PoC — restore group-conditional admin nav once AD groups are
// provisioned (SAWS-Records-Admin, SAWS-Records-Staff). During PoC all
// authenticated users see all nav items.

export default function Layout() {
  const { user } = useAuth();

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <a href="http://localhost:3000" className="portal-back">&#9664; Portal</a>
          <span>AquaRecords</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name || user?.email}</span>
          <span className="role-badge">SAWS</span>
          <ThemeToggle />
          <a href="/.auth/logout" className="logout-btn">Logout</a>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/internal/queue">Queue</NavLink>
        <NavLink to="/internal/dashboard">Dashboard</NavLink>
        <NavLink to="/admin/reports">Reports</NavLink>
        <NavLink to="/admin/exemptions">Exemptions</NavLink>
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
