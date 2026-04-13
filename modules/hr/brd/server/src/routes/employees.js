const express = require('express');
const { param, query, validationResult } = require('express-validator');
const { sql, getDb } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Ref: BRD 6.1 - Inactive Employee Directory
// "All the inactive employee's information (to include their photo) is centralized within this area."

// GET /api/employees/inactive - list inactive employees with photos
router.get('/inactive', authenticate, async (req, res) => {
  try {
    const { search, department, page = 1, limit = 20 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const pool = await getDb();
    const request = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, pageSize);

    let whereClause = 'WHERE e.IsActive = 0';

    if (search) {
      whereClause += ` AND (e.FirstName LIKE @search OR e.LastName LIKE @search OR e.Email LIKE @search)`;
      request.input('search', sql.NVarChar(100), `%${search}%`);
    }

    if (department) {
      whereClause += ` AND d.DepartmentName = @department`;
      request.input('department', sql.NVarChar(100), department);
    }

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) AS total
      FROM dbo.Employees e
      LEFT JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID
      ${whereClause}
    `);

    // Get paginated results
    const request2 = pool.request()
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, pageSize);

    if (search) request2.input('search', sql.NVarChar(100), `%${search}%`);
    if (department) request2.input('department', sql.NVarChar(100), department);

    const result = await request2.query(`
      SELECT e.EmployeeID, e.FirstName, e.LastName, e.Email, e.Phone,
             e.JobTitle, e.PhotoURL, e.HireDate, e.TerminationDate,
             d.DepartmentName
      FROM dbo.Employees e
      LEFT JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID
      ${whereClause}
      ORDER BY e.LastName, e.FirstName
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    res.json({
      employees: result.recordset,
      pagination: {
        page: parseInt(page, 10),
        limit: pageSize,
        total: countResult.recordset[0].total,
        totalPages: Math.ceil(countResult.recordset[0].total / pageSize),
      },
    });
  } catch (err) {
    console.error('Error fetching inactive employees:', err);
    res.status(500).json({ error: 'Failed to fetch inactive employees' });
  }
});

// GET /api/employees/inactive/:id - get inactive employee detail
router.get('/inactive/:id', authenticate, [
  param('id').isInt({ min: 1 }).withMessage('Valid employee ID required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('employeeId', sql.Int, req.params.id)
      .query(`
        SELECT e.EmployeeID, e.FirstName, e.LastName, e.Email, e.Phone,
               e.JobTitle, e.PhotoURL, e.HireDate, e.TerminationDate,
               e.Address, e.City, e.State, e.ZipCode,
               d.DepartmentName
        FROM dbo.Employees e
        LEFT JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID
        WHERE e.EmployeeID = @employeeId AND e.IsActive = 0
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Inactive employee not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching inactive employee:', err);
    res.status(500).json({ error: 'Failed to fetch employee detail' });
  }
});

// GET /api/employees/departments - get unique departments for filtering
router.get('/departments', authenticate, async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(`
      SELECT DISTINCT d.DepartmentName
      FROM dbo.Employees e
      INNER JOIN dbo.Departments d ON e.DepartmentID = d.DepartmentID
      WHERE e.IsActive = 0 AND d.DepartmentName IS NOT NULL
      ORDER BY d.DepartmentName
    `);
    res.json(result.recordset.map((r) => r.DepartmentName));
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

module.exports = router;
