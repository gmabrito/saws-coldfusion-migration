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

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="app-layout">
      <header className="app-header">
        <a href={PORTAL_URL} className="portal-back" title="Back to EZ Link Portal">&#9664; Portal</a>
        <h1>SAWS On-Call Directory</h1>
        <div className="user-info">
          {user ? (
            <>
              <span>{user.name} ({user.departmentName})</span>
              <button className="btn-logout" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn-logout" style={{ textDecoration: 'none' }}>
              Admin Login
            </NavLink>
          )}
        </div>
      </header>
      <nav className="app-nav">
        <NavLink to="/directory" end>
          On-Call Directory
        </NavLink>
        {isAdmin && (
          <>
            <NavLink to="/admin/schedule">
              Manage Schedule
            </NavLink>
            <NavLink to="/admin/schedule/new">
              New Assignment
            </NavLink>
          </>
        )}
      </nav>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
