require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const jobsRoutes = require('./routes/jobs');
const employeesRoutes = require('./routes/employees');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Auth route - mock AD login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Mock authentication - in production this would validate against Active Directory
  const mockUsers = {
    'admin@saws.org': { employeeId: 1, name: 'HR Admin', email: 'admin@saws.org', roles: ['ADMIN', 'USER'] },
    'user@saws.org': { employeeId: 2, name: 'HR User', email: 'user@saws.org', roles: ['USER'] },
  };

  const user = mockUsers[email];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { employeeId: user.employeeId, email: user.email, name: user.name, roles: user.roles },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({ user, token });
});

// Routes
app.use('/api/jobs', jobsRoutes);
app.use('/api/employees', employeesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'hr', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SAWS HR API running on port ${PORT}`);
});
