/**
 * Auth middleware — simple JWT verification.
 * In production: validates Authorization: Bearer <token> header.
 * In local dev:  injects DEV_USER when NODE_ENV !== 'production'.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-sitrep';

const DEV_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@saws.org',
  role: 'eoc_staff',
  isAdmin: true,
};

function authenticate(req, res, next) {
  // In non-production, inject dev user if no token present
  if (process.env.NODE_ENV !== 'production') {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      req.user = DEV_USER;
      return next();
    }
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
