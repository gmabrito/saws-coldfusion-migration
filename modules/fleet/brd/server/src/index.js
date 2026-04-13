const express = require('express');
const cors = require('cors');
require('dotenv').config();

const vehiclesRoutes = require('./routes/vehicles');

const app = express();
app.use(cors());
app.use(express.json());

// Fleet vehicle management routes
app.use('/api', vehiclesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'fleet-vehicle-management' });
});

// Login endpoint (mock AD auth)
const jwt = require('jsonwebtoken');

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const mockUsers = {
    admin: { id: 1, username: 'admin', name: 'Admin User', role: 'admin', employeeId: 1001 },
    fleet: { id: 2, username: 'fleet', name: 'Fleet Manager', role: 'user', employeeId: 1002 }
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

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Fleet Vehicle Management server running on port ${PORT}`));
