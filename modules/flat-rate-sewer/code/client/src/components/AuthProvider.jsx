import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const AuthContext = createContext(null);

const MOCK_USERS = {
  'admin@saws.org': {
    oid: 'ad-oid-001',
    preferred_username: 'admin@saws.org',
    name: 'FRS Administrator',
    groups: ['SAWS-FRS-Admin', 'SAWS-FRS-User'],
    employeeId: 'E1001',
    password: 'admin',
  },
  'user@saws.org': {
    oid: 'ad-oid-002',
    preferred_username: 'user@saws.org',
    name: 'FRS Standard User',
    groups: ['SAWS-FRS-User'],
    employeeId: 'E1002',
    password: 'user',
  },
  'readonly@saws.org': {
    oid: 'ad-oid-003',
    preferred_username: 'readonly@saws.org',
    name: 'FRS Read-Only User',
    groups: ['SAWS-FRS-ReadOnly'],
    employeeId: 'E1003',
    password: 'readonly',
  },
};

const SSO_TOKENS = {
  'sso-admin-token': 'admin@saws.org',
  'sso-user-token': 'user@saws.org',
  'sso-readonly-token': 'readonly@saws.org',
};

function resolveInitialUser() {
  const params = new URLSearchParams(window.location.search);
  const ssoToken = params.get('sso_token');
  if (ssoToken && SSO_TOKENS[ssoToken]) {
    const email = SSO_TOKENS[ssoToken];
    const { password, ...claims } = MOCK_USERS[email];
    return { user: claims, token: `mock-jwt-${claims.oid}` };
  }
  const stored = sessionStorage.getItem('frs_auth');
  if (stored) {
    try { return JSON.parse(stored); } catch { /* ignore */ }
  }
  return null;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(resolveInitialUser);

  const login = useCallback(async (email, password) => {
    const entry = MOCK_USERS[email?.toLowerCase()];
    if (!entry) return { success: false, error: 'User not found. Try: admin@saws.org, user@saws.org, or readonly@saws.org' };

    // Get a real JWT from the server API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password: password || 'dev' }),
      });
      const result = await res.json();
      if (res.ok && result.access_token) {
        const data = { user: result.user, token: result.access_token };
        sessionStorage.setItem('frs_auth', JSON.stringify(data));
        setAuth(data);
        return { success: true };
      }
    } catch (err) {
      console.warn('Server auth failed, using local mock:', err.message);
    }

    // Fallback: local mock if server is down
    const { password: _pw, ...claims } = entry;
    const data = { user: claims, token: `mock-jwt-${claims.oid}` };
    sessionStorage.setItem('frs_auth', JSON.stringify(data));
    setAuth(data);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('frs_auth');
    setAuth(null);
  }, []);

  const hasGroup = useCallback(
    (group) => auth?.user?.groups?.includes(group) ?? false,
    [auth]
  );

  const hasAnyGroup = useCallback(
    (groups) => groups.some((g) => auth?.user?.groups?.includes(g)),
    [auth]
  );

  const isAdmin = useMemo(
    () => auth?.user?.groups?.includes('SAWS-FRS-Admin') ?? false,
    [auth]
  );

  const isUser = useMemo(
    () => auth?.user?.groups?.includes('SAWS-FRS-User') ?? false,
    [auth]
  );

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isAuthenticated: !!auth?.user,
      isAdmin,
      isUser,
      login,
      logout,
      hasGroup,
      hasAnyGroup,
    }),
    [auth, isAdmin, isUser, login, logout, hasGroup, hasAnyGroup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
