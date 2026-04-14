import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PORTAL_URL = 'http://localhost:3000';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    window.location.href = PORTAL_URL;
  }

  const canEnterData = user?.role === 'admin' || user?.role === 'operator';

  return (
    <div className="app-layout">
      <header className="app-header">
        <a href={PORTAL_URL} className="portal-back" title="Back to EZ Link Portal">&#9664; Portal</a>
        <h1>SAWS Water Resources - Aquifer Stats</h1>
        <div className="user-info">
          <span>{user?.name} ({user?.departmentName})</span>
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>
      <nav className="app-nav">
        <NavLink to="/dashboard" end>
          Dashboard
        </NavLink>
        <NavLink to="/daily-readings">
          Daily Readings
        </NavLink>
        {canEnterData && (
          <NavLink to="/data-entry">
            Data Entry
          </NavLink>
        )}
      </nav>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
