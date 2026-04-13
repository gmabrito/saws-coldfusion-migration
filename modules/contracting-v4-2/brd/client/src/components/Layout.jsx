import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="app-header">
        <h1>SAWS Contracting - Solicitations</h1>
        <nav>
          <NavLink to="/solicitations" className={({ isActive }) => isActive ? 'active' : ''}>
            Solicitations
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
