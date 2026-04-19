/**
 * Layout — two display modes based on auth state.
 *
 * Public mode (user === null):
 *   - Simple header: SAWS logo + "Utility Locate Request" title
 *   - No portal back link (this is an external app, not an internal portal)
 *   - Nav shows "Submit Request" always and "Staff Login" link
 *   - No user-info block, no ThemeToggle in header
 *
 * Staff mode (user !== null):
 *   - Full header: SAWS brand, module title, user-info, ThemeToggle, Logout
 *   - Nav shows "Submit Request" + "Staff Queue" (active when on /admin)
 *   - Portal back link NOT shown — this is an external app
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@saws/ui-shell';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <span>SAWS</span>
          <span style={{ opacity: 0.6, fontWeight: 400, fontSize: '15px' }}>
            Utility Locate Request
          </span>
        </div>

        {isStaff ? (
          <div className="user-info">
            <span className="user-name">{user?.name || user?.email}</span>
            <span className="role-badge">Staff</span>
            <ThemeToggle />
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="user-info">
            <ThemeToggle />
          </div>
        )}
      </header>

      <nav className="app-nav">
        <NavLink to="/" end>
          Submit Request
        </NavLink>
        {isStaff ? (
          <NavLink to="/admin">Staff Queue</NavLink>
        ) : (
          <NavLink to="/admin/login">Staff Login</NavLink>
        )}
      </nav>

      <main>
        <Outlet />
      </main>
    </>
  );
}
