import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <header style={{
        backgroundColor: 'var(--saws-navy)',
        color: 'white',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/" style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', textDecoration: 'none' }}>
            SAWS - Emergency SMS Opt-in
          </Link>
          <nav style={{ display: 'flex', gap: '16px' }}>
            <Link to="/" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>Opt-In Form</Link>
            {isAdmin && (
              <Link to="/admin" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none' }}>Admin</Link>
            )}
          </nav>
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px' }}>Welcome, {user.name}</span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="container">
        {children}
      </main>
    </div>
  );
}
