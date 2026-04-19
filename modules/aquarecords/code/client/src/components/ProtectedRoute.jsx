import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

// groups prop: post-PoC use only. Pass AD group names to restrict a route.
// During PoC, groups is always [] so the group check never fires.
// The auth provider exposes hasGroup(group); hasAnyGroup is a local helper.
export default function ProtectedRoute({ children, groups = [] }) {
  const { user, isAuthenticated, hasGroup, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Authenticating…</div>;

  if (!isAuthenticated) {
    return <Navigate to="/.auth/login/aad" state={{ from: location }} replace />;
  }

  // Group check — only active when groups prop is provided (post-PoC)
  if (groups.length > 0 && !groups.some(g => hasGroup(g))) {
    return (
      <div className="app-content" style={{ padding: 40 }}>
        <div style={{ color: '#c53030', border: '1px solid #c53030', borderRadius: 8, padding: '1rem' }}>
          <strong>Access Denied</strong> — your account does not belong to a required group.
          <br />Required: {groups.join(', ')}
          <br /><br />Contact your IS administrator to request access.
        </div>
      </div>
    );
  }

  return children;
}
