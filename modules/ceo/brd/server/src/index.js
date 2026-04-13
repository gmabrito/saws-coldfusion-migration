const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const agendasRouter = require('./routes/agendas');
const subscribersRouter = require('./routes/subscribers');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'ceo', timestamp: new Date().toISOString() });
});

// Mock login endpoint for development
// In production, this would integrate with Active Directory
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Mock users for development
  const mockUsers = {
    admin: { employeeId: 1, name: 'CEO Admin', role: 'admin' },
    staff: { employeeId: 2, name: 'CEO Staff', role: 'ceo_staff' },
    viewer: { employeeId: 3, name: 'Board Viewer', role: 'viewer' }
  };

  const user = mockUsers[username];
  if (!user || password !== 'password') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { employeeId: user.employeeId, name: user.name, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-key',
    { expiresIn: '8h' }
  );

  res.json({ token, user });
});

// Routes
app.use('/api/agendas', agendasRouter);
app.use('/api/subscribers', subscribersRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SAWS CEO Server running on port ${PORT}`);
});
