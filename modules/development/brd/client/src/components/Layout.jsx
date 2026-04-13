import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="app-header">
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
          <button className="btn-logout" onClick={logout}>Sign Out</button>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
