import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const ADMIN_GROUPS = ['SAWS-Records-Admin'];

export default function Layout() {
  const { user, hasAnyGroup } = useAuth();
  const isAdmin = hasAnyGroup(ADMIN_GROUPS);

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <a href="http://localhost:3000" className="portal-back">&#9664; Portal</a>
          <span>AquaRecords</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          {isAdmin && <span className="role-badge admin">admin</span>}
          <a href="/.auth/logout" className="logout-btn" style={{ textDecoration: 'none' }}>
            Logout
          </a>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/internal/queue">Queue</NavLink>
        <NavLink to="/internal/dashboard">Dashboard</NavLink>
        {isAdmin && (
          <>
            <NavLink to="/admin/reports">Reports</NavLink>
            <NavLink to="/admin/exemptions">Exemptions</NavLink>
          </>
        )}
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
