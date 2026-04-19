'use strict';

/**
 * Auth middleware for Locates module.
 *
 * This is an external public-facing app. The public submission routes
 * require NO authentication. Only /api/locates (GET/PATCH) and admin
 * routes require a valid JWT issued by POST /api/auth/login.
 *
 * optionalAuth  — populates req.user if a valid Bearer token is present,
 *                 but never returns 401. Safe to use on public routes.
 * requireAuth   — returns 401 if no valid token; used on staff-only routes.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'locates-dev-secret-change-in-production';

/**
 * Parse and verify a Bearer token from the Authorization header.
 * Returns the decoded payload or null.
 */
function parseToken(req) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * optionalAuth — attach req.user when a valid token is present.
 * No 401 on missing/invalid token — public routes are fully accessible.
 */
function optionalAuth(req, res, next) {
  req.user = parseToken(req) || null;
  next();
}

/**
 * requireAuth — staff-only routes. Returns 401 if no valid token.
 */
function requireAuth(req, res, next) {
  const user = parseToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = user;
  next();
}

/**
 * requireStaff — ensures user has role staff or admin.
 */
function requireStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Staff access required' });
  }
  next();
}

module.exports = { optionalAuth, requireAuth, requireStaff };
