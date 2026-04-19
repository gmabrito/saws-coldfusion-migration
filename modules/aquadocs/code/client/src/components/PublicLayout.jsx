import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <>
      <header className="public-header">
        <div className="brand">SAWS — AquaDocs Document Search</div>
        <a href="/.auth/login/aad" className="staff-link">
          Staff Login
        </a>
      </header>

      <main>
        <Outlet />
      </main>
    </>
  );
}
