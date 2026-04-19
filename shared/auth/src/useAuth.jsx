/**
 * @saws/auth — React auth provider for Azure Static Web Apps
 *
 * Production: reads user identity from /.auth/me (injected by Azure SWA).
 * Local dev:  falls back to LOCAL_DEV_USER so the app works without Azure.
 *
 * Logout:  window.location.href = '/.auth/logout'  (handled by SWA runtime)
 * Login:   automatic — staticwebapp.config.json redirects 401 → /.auth/login/aad
 */

import { createContext, useContext, useState, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Maps Azure SWA clientPrincipal claims array to a flat object.
 * Claim type URIs vary by identity provider; we handle common AAD ones.
 */
function mapClaims(claims = []) {
  const map = {};
  for (const { typ, val } of claims) {
    // Shorten the long URIs to readable keys
    const key = typ
      .replace('http://schemas.microsoft.com/identity/claims/', '')
      .replace('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/', '')
      .replace('http://schemas.microsoft.com/ws/2008/06/identity/claims/', '');
    map[key] = val;
  }
  return map;
}

function mapAzureUser(clientPrincipal) {
  const c = mapClaims(clientPrincipal.claims);

  // Display name: prefer the 'name' claim, fall back to userDetails (UPN)
  const fullName = c.name || clientPrincipal.userDetails || '';
  const nameParts = fullName.split(' ');

  return {
    oid:            c.objectidentifier || clientPrincipal.userId,
    username:       clientPrincipal.userDetails,          // UPN: jsmith@saws.org
    email:          c.emailaddress || clientPrincipal.userDetails,
    firstName:      c.givenname || nameParts[0] || '',
    lastName:       c.surname   || nameParts.slice(1).join(' ') || '',
    displayName:    fullName,
    department:     c.department || '',
    title:          c.jobtitle  || '',
    // userRoles comes from SWA role assignments; groups come from AAD claims
    roles:          clientPrincipal.userRoles || [],
    groups:         (c.groups || '').split(',').filter(Boolean),
    isAuthenticated: true,
  };
}

// ── Local dev fallback ─────────────────────────────────────────────────────

const LOCAL_DEV_USER = {
  oid:            'dev-oid-local-001',
  username:       'dev@saws.org',
  email:          'dev@saws.org',
  firstName:      'Dev',
  lastName:       'User',
  displayName:    'Dev User',
  department:     'Information Services',
  title:          'Developer',
  roles:          ['authenticated', 'anonymous', 'admin'],
  groups:         ['SAWS-Developers', 'SAWS-IS'],
  isAuthenticated: true,
};

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/.auth/me');
        if (res.ok) {
          const { clientPrincipal } = await res.json();
          if (clientPrincipal) {
            setUser(mapAzureUser(clientPrincipal));
            setLoading(false);
            return;
          }
        }
      } catch (_) {
        // Network error or /.auth/me not available (local dev without SWA CLI)
      }

      // Local dev fallback — only in dev mode
      if (import.meta.env.DEV) {
        setUser(LOCAL_DEV_USER);
      }
      // In production the SWA config redirects unauthenticated users to AAD
      // before they ever reach this code, so user stays null only briefly.
      setLoading(false);
    }

    loadUser();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    hasRole:  (role)  => user?.roles?.includes(role)  ?? false,
    hasGroup: (group) => user?.groups?.includes(group) ?? false,
    logout: () => {
      window.location.href = '/.auth/logout?post_logout_redirect_uri=/';
    },
  };

  // Render nothing while we resolve identity — avoids flash of wrong content
  if (loading) return null;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within <AuthProvider>');
  return context;
}
