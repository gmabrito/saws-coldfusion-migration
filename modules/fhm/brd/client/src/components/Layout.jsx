import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ThemeToggle } from '@saws/ui-shell';

const PORTAL_URL = 'http://localhost:3000';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = PORTAL_URL;
  };

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <a href={PORTAL_URL} className="portal-back">&#9664; Portal</a>
          <span>Fire Hydrant Meter</span>
        </div>
        <div className="user-info">
          {user && <span className="user-name">{user.contact_name || user.name || user.email}</span>}
          <span className="role-badge">SAWS</span>
          <ThemeToggle />
          {user && <button onClick={handleLogout} className="logout-btn">Logout</button>}
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/contracts">Contracts</NavLink>
        <NavLink to="/readings">Submit Reading</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        {isAdmin && <NavLink to="/admin/contracts">Admin</NavLink>}
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
