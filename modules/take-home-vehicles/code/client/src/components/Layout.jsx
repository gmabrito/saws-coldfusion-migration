import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ThemeToggle } from '@saws/ui-shell';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <a href="http://localhost:3000" className="portal-back">&#9664; Portal</a>
          <span>SAWS Take Home Vehicles</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          {user?.isAdmin && <span className="role-badge admin">admin</span>}
          {!user?.isAdmin && user?.isManager && <span className="role-badge user">manager</span>}
          {!user?.isAdmin && !user?.isManager && <span className="role-badge readonly">employee</span>}
          <ThemeToggle />
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/request/new">New Request</NavLink>
        <NavLink to="/my-requests">My Requests</NavLink>
        {(user?.isAdmin || user?.isManager) && (
          <NavLink to="/admin">Admin</NavLink>
        )}
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
