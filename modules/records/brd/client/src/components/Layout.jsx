import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>SAWS Records Management</h1>
        <div className="user-info">
          <span>{user?.name} ({user?.departmentName})</span>
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>
      <nav className="app-nav">
        <NavLink to="/transmittals" end>
          Transmittals
        </NavLink>
        <NavLink to="/transmittals/new">
          New Transmittal
        </NavLink>
        <NavLink to="/search">
          Search Records
        </NavLink>
      </nav>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
