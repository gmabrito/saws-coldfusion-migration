import { NavLink, Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <>
      <header className="public-header">
        <div className="brand">SAWS — Open Records (Texas PIA)</div>
        <nav style={{ display: 'flex', gap: 16 }}>
          <NavLink to="/public" className="staff-link">About</NavLink>
          <NavLink to="/public/request" className="staff-link">Submit Request</NavLink>
          <NavLink to="/public/status" className="staff-link">Check Status</NavLink>
          <a href="/.auth/login/aad" className="staff-link">Staff Login</a>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  );
}
