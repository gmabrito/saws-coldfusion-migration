const express = require('express');
const cors = require('cors');
require('dotenv').config();

const optinsRoutes = require('./routes/optins');

const app = express();
app.use(cors());
app.use(express.json());

// BRD 7.1 - Emergency SMS Text Message Notification Opt-in routes
app.use('/api', optinsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'is-part1-sms-optin' });
});

// Login endpoint (mock AD auth)
const jwt = require('jsonwebtoken');

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Mock Active Directory authentication
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Mock user lookup
  const mockUsers = {
    admin: { id: 1, username: 'admin', name: 'Admin User', role: 'admin', employeeId: 1001 },
    employee: { id: 2, username: 'employee', name: 'John Smith', role: 'user', employeeId: 1002 }
  };

  const user = mockUsers[username];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role, employeeId: user.employeeId },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`IS Part 1 SMS Opt-in server running on port ${PORT}`));
