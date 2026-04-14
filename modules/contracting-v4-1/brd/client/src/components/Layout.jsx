import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PORTAL_URL = 'http://localhost:3000';

const navItems = [
  { path: '/', label: 'Vendor Search' },
  { path: '/vendors/new', label: 'Add Vendor' }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    window.location.href = PORTAL_URL;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <a href={PORTAL_URL} className="portal-back" title="Back to EZ Link Portal">&#9664; Portal</a>
          <div className="sidebar-brand">SAWS</div>
          <div className="sidebar-subtitle">EZ Link Portal</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="app-header">
          <h1 className="header-title">Vendor Directory</h1>
          <div className="header-user">
            <span>{user?.firstName} {user?.lastName} | {user?.department}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
