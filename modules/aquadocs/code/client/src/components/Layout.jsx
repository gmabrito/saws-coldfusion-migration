import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { ThemeToggle } from '@saws/ui-shell';

// NOTE: Post-PoC — restore group-conditional admin nav once AD groups are
// provisioned (SAWS-AquaDocs-Admin). During PoC all authenticated users
// see all nav items.

export default function Layout() {
  const { user } = useAuth();

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <a href="http://localhost:3000" className="portal-back">&#9664; Portal</a>
          <span>AquaDocs</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name || user?.email}</span>
          <span className="role-badge">SAWS</span>
          <ThemeToggle />
          <a href="/.auth/logout" className="logout-btn">Logout</a>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/search">Search</NavLink>
        <NavLink to="/chat">Chat</NavLink>
        <NavLink to="/admin/pipeline">Pipeline</NavLink>
        <NavLink to="/admin/documents">Documents</NavLink>
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
