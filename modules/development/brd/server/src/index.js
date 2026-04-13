const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const meetingsRouter = require('./routes/meetings');
const contractorsRouter = require('./routes/contractors');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'development', timestamp: new Date().toISOString() });
});

// Mock login endpoint for development/testing
app.post('/api/auth/login', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const token = jwt.sign(
    {
      employeeId: 1,
      username,
      name: username,
      roles: ['Admin', 'User'],
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({ token, user: { employeeId: 1, username, name: username, roles: ['Admin', 'User'] } });
});

// Mount route modules
app.use('/api/meetings', meetingsRouter);
app.use('/api/contractors', contractorsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log(`SAWS Development Services API running on port ${PORT}`);
});
