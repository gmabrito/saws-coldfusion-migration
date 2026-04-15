import { useAuth } from './AuthProvider';

export default function RoleGate({ groups, children, fallback = null }) {
  const { hasAnyGroup } = useAuth();

  if (!groups || groups.length === 0) return children;
  if (hasAnyGroup(groups)) return children;
  return fallback;
}
