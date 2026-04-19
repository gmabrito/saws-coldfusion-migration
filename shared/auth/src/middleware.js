/**
 * @saws/auth — Express middleware for Azure Static Web Apps
 *
 * Production: Azure SWA injects the X-MS-CLIENT-PRINCIPAL header on every
 * request that passes through the platform. No JWT validation needed — Azure
 * has already authenticated the user before the request reaches this server.
 *
 * Local dev: SKIP_AUTH=true in .env bypasses auth and injects a dev user,
 * so the Express server works without the SWA CLI running.
 *
 * Usage:
 *   const { authenticate, requireGroup } = require('@saws/auth/server');
 *   app.use(authenticate);
 *   router.get('/admin', requireGroup('SAWS-Admins'), handler);
 */

'use strict';

// ── Local dev user ──────────────────────────────────────────────────────────

const DEV_USER = {
  oid:      'dev-oid-local-001',
  username: 'dev@saws.org',
  email:    'dev@saws.org',
  name:     'Dev User',
  roles:    ['authenticated', 'anonymous', 'admin'],
  groups:   ['SAWS-Developers', 'SAWS-IS'],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function mapClaims(claims = []) {
  const map = {};
  for (const { typ, val } of claims) {
    const key = typ
      .replace('http://schemas.microsoft.com/identity/claims/', '')
      .replace('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/', '')
      .replace('http://schemas.microsoft.com/ws/2008/06/identity/claims/', '');
    map[key] = val;
  }
  return map;
}

function parseClientPrincipal(req) {
  const header = req.headers['x-ms-client-principal'];
  if (!header) return null;
  try {
    const decoded = Buffer.from(header, 'base64').toString('utf8');
    const principal = JSON.parse(decoded);
    const c = mapClaims(principal.claims);
    return {
      oid:      c.objectidentifier || principal.userId,
      username: principal.userDetails,
      email:    c.emailaddress || principal.userDetails,
      name:     c.name || principal.userDetails,
      roles:    principal.userRoles || [],
      groups:   (c.groups || '').split(',').filter(Boolean),
    };
  } catch {
    return null;
  }
}

// ── Middleware ──────────────────────────────────────────────────────────────

/**
 * authenticate — populates req.user from Azure SWA header.
 * Always call this first; downstream middleware can assume req.user exists.
 */
function authenticate(req, res, next) {
  // Production: read from Azure SWA injected header
  const principal = parseClientPrincipal(req);
  if (principal) {
    req.user = principal;
    return next();
  }

  // Local dev bypass
  if (process.env.SKIP_AUTH === 'true' || process.env.NODE_ENV !== 'production') {
    req.user = DEV_USER;
    return next();
  }

  return res.status(401).json({ error: 'Not authenticated' });
}

/**
 * requireRole(...roles) — 403 if req.user doesn't have at least one role.
 * Roles come from Azure SWA role assignments.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (roles.some(r => req.user.roles.includes(r))) return next();
    return res.status(403).json({ error: 'Insufficient role' });
  };
}

/**
 * requireGroup(...groups) — 403 if req.user doesn't belong to at least one AD group.
 * Groups come from AAD group claims on the token.
 */
function requireGroup(...groups) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (groups.some(g => req.user.groups.includes(g))) return next();
    return res.status(403).json({ error: 'Insufficient group membership' });
  };
}

module.exports = { authenticate, requireRole, requireGroup, parseClientPrincipal };
