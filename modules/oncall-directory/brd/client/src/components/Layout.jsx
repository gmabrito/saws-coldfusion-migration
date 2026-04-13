import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="app-layout">
      <header className="app-header">
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
