const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Mock users for the prototype
const MOCK_USERS = {
  'admin@saws.org': {
    uid: 1,
    email: 'admin@saws.org',
    contact_name: 'Jane Smith',
    business_name: 'SAWS',
    roles: ['ADMIN', 'FHM'],
    employeeId: 1,
  },
  'user@saws.org': {
    uid: 2,
    email: 'user@saws.org',
    contact_name: 'Robert Johnson',
    business_name: 'SAWS',
    roles: ['FHM'],
    employeeId: 4,
  },
  'vendor@example.com': {
    uid: 3,
    email: 'vendor@example.com',
    contact_name: 'Test Vendor',
    business_name: 'ABC Construction',
    roles: ['FHM'],
    employeeId: null,
  },
};

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = MOCK_USERS[email];
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // In prototype, any password works
  const token = jwt.sign(
    {
      uid: user.uid,
      email: user.email,
      roles: user.roles,
      contact_name: user.contact_name,
      business_name: user.business_name,
      employeeId: user.employeeId,
    },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      uid: user.uid,
      email: user.email,
      contact_name: user.contact_name,
      business_name: user.business_name,
      roles: user.roles,
    },
  });
});

module.exports = router;
