import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function Layout() {
  const { user, isAdmin, isUser, logout } = useAuth();

  const primaryRole = isAdmin ? 'admin' : isUser ? 'user' : 'readonly';

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <a href="http://localhost:3000" className="portal-back">&#9664; Portal</a>
          <span>SAWS Flat Rate Sewer</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className={`role-badge ${primaryRole}`}>{primaryRole}</span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="app-nav">
        <NavLink to="/" end>Dashboard</NavLink>
        {(isAdmin || isUser) && (
          <>
            <NavLink to="/accounts">Accounts</NavLink>
            <NavLink to="/meters/search">Meters</NavLink>
            <NavLink to="/readings">Readings</NavLink>
          </>
        )}
        {isAdmin && (
          <>
            <NavLink to="/assessments">Assessments</NavLink>
            <NavLink to="/admin/rates">Rates</NavLink>
            <NavLink to="/admin/audit">Audit Log</NavLink>
          </>
        )}
      </nav>

      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
