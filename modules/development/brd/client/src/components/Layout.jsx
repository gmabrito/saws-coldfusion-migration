import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PORTAL_URL = 'http://localhost:3000';

export default function Layout() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = PORTAL_URL;
  };

  return (
    <>
      <header className="app-header">
        <a href={PORTAL_URL} className="portal-back" title="Back to EZ Link Portal">&#9664; Portal</a>
        <h1>SAWS Development Services</h1>
        <nav>
          <NavLink to="/meetings" className={({ isActive }) => isActive ? 'active' : ''}>
            CIAC Meetings
          </NavLink>
          <NavLink to="/contractors" className={({ isActive }) => isActive ? 'active' : ''}>
            Contractor Registry
          </NavLink>
        </nav>
        <div className="header-user">
          <span>{user?.name}</span>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
