import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export default function ProtectedRoute({ children, groups }) {
  const { isAuthenticated, hasAnyGroup } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (groups && groups.length > 0 && !hasAnyGroup(groups)) {
    return (
      <div className="app-content">
        <div className="alert alert-danger">
          Access denied. You do not have the required permissions for this page.
        </div>
      </div>
    );
  }

  return children;
}
