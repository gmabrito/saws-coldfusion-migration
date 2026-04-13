const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { generateToken } = require('./middleware/auth');
const vendorRoutes = require('./routes/vendors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'contracting-v4-1', timestamp: new Date().toISOString() });
});

// Mock login endpoint for prototype
// In production this would validate against Active Directory
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Mock user for bakeoff prototype
  const mockUser = {
    userId: 1,
    username,
    firstName: 'Jane',
    lastName: 'Smith',
    department: 'Contracting',
    roles: ['admin', 'user']
  };

  const token = generateToken(mockUser);
  res.json({ token, user: mockUser });
});

// Routes
app.use('/api/vendors', vendorRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Contracting V4-1 server running on port ${PORT}`);
});
