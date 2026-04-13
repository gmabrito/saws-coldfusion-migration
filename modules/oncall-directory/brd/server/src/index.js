const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { authenticate, loginHandler } = require('./middleware/auth');
const oncallRoutes = require('./routes/oncall');
const { sql, getPool } = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'oncall-directory', timestamp: new Date().toISOString() });
});

// Auth
app.post('/api/auth/login', loginHandler);

// GET /api/departments - List departments (from dbo.Departments)
// BRD 7.1: Contact info by department
app.get('/api/departments', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT DepartmentID, DepartmentName FROM dbo.Departments ORDER BY DepartmentName');
    res.json({ data: result.recordset });
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
});

// GET /api/employees - List employees, optionally filtered by department
app.get('/api/employees', authenticate, async (req, res) => {
  try {
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId) : null;
    const pool = await getPool();
    const request = pool.request();

    let query = `
      SELECT e.EmployeeID, e.FirstName, e.LastName, e.Email, e.Phone,
             e.DepartmentID, d.DepartmentName
      FROM dbo.Employees e
      INNER JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID
    `;

    if (departmentId) {
      query += ' WHERE e.DepartmentID = @DepartmentID';
      request.input('DepartmentID', sql.Int, departmentId);
    }

    query += ' ORDER BY e.LastName, e.FirstName';

    const result = await request.query(query);
    res.json({ data: result.recordset });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees.' });
  }
});

// On-call routes
app.use('/api/oncall', oncallRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SAWS On-Call Directory API server running on port ${PORT}`);
});
