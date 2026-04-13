const jwt = require('jsonwebtoken');

// JWT authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Role-based authorization middleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

// Login endpoint handler - mock AD auth for prototype
function loginHandler(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Mock users for prototype
  const mockUsers = {
    admin: {
      employeeId: 1,
      username: 'admin',
      name: 'Admin User',
      role: 'admin',
      departmentId: 1,
      departmentName: 'Information Services'
    },
    manager: {
      employeeId: 2,
      username: 'manager',
      name: 'Dept Manager',
      role: 'manager',
      departmentId: 2,
      departmentName: 'Water Resources'
    },
    user: {
      employeeId: 3,
      username: 'user',
      name: 'Staff User',
      role: 'user',
      departmentId: 3,
      departmentName: 'Finance'
    }
  };

  const user = mockUsers[username];
  if (!user || password !== 'password') {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });

  res.json({ token, user });
}

module.exports = { authenticate, requireRole, loginHandler };
