const jwt = require('jsonwebtoken');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-frs';
const TOKEN_EXPIRY = '8h';

/**
 * Mock users with AD group memberships.
 * Mimics Azure AD / Entra ID token claims structure.
 */
const MOCK_USERS = {
  'admin@saws.org': {
    oid: '550e8400-e29b-41d4-a716-446655440000',
    preferred_username: 'admin@saws.org',
    name: 'Alex Thompson',
    groups: ['SAWS-FRS-Admin', 'SAWS-FRS-User'],
    employeeId: '9900001',
  },
  'user@saws.org': {
    oid: '550e8400-e29b-41d4-a716-446655440001',
    preferred_username: 'user@saws.org',
    name: 'Jordan Rivera',
    groups: ['SAWS-FRS-User'],
    employeeId: '9900002',
  },
  'readonly@saws.org': {
    oid: '550e8400-e29b-41d4-a716-446655440002',
    preferred_username: 'readonly@saws.org',
    name: 'Casey Williams',
    groups: ['SAWS-FRS-ReadOnly'],
    employeeId: '9900003',
  },
};

/**
 * POST /api/auth/login
 * Accepts { username, password } and returns a JWT mimicking an Azure AD token.
 * In production this will be replaced by MSAL / Entra ID OIDC flow.
 */
function login(req, res) {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = MOCK_USERS[username.toLowerCase()];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // In dev mode any password works; in production this endpoint is removed
  // and replaced by the MSAL redirect flow.
  const tokenPayload = {
    oid: user.oid,
    preferred_username: user.preferred_username,
    name: user.name,
    groups: user.groups,
    employeeId: user.employeeId,
    iss: 'https://login.microsoftonline.com/saws-tenant-id/v2.0',
    aud: 'saws-frs-api',
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  eventBus.publish(EVENT_TYPES.USER_LOGIN, {
    user: user.preferred_username,
    name: user.name,
  });

  return res.json({
    access_token: token,
    token_type: 'Bearer',
    expires_in: TOKEN_EXPIRY,
    user: {
      oid: user.oid,
      name: user.name,
      preferred_username: user.preferred_username,
      groups: user.groups,
      employeeId: user.employeeId,
    },
  });
}

/**
 * Middleware: authenticate
 * Validates JWT from Authorization header, populates req.user with AD-style claims.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      oid: decoded.oid,
      preferred_username: decoded.preferred_username,
      name: decoded.name,
      groups: decoded.groups || [],
      employeeId: decoded.employeeId,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { login, authenticate, MOCK_USERS };
