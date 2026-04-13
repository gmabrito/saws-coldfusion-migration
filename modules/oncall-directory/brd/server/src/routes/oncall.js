const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { sql, getPool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation helper
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
}

// GET /api/oncall - Get current on-call staff, optionally filtered by department
// BRD 7.1: Schedule showing what employee is on-call, contact info by department
router.get('/',
  [
    query('departmentId').optional().isInt().toInt()
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const departmentId = req.query.departmentId || null;
      const pool = await getPool();
      const result = await pool.request()
        .input('DepartmentID', sql.Int, departmentId)
        .execute('oncall.usp_GetCurrentOnCall');

      res.json({ data: result.recordset });
    } catch (err) {
      console.error('Error fetching current on-call:', err);
      res.status(500).json({ error: 'Failed to fetch on-call directory.' });
    }
  }
);

// GET /api/oncall/schedule - Get schedule for date range
// BRD 7.2: Enhanced filtering and date range queries
router.get('/schedule',
  authenticate,
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('departmentId').optional().isInt().toInt(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const startDate = req.query.startDate || null;
      const endDate = req.query.endDate || null;
      const departmentId = req.query.departmentId || null;
      const page = req.query.page || 1;
      const pageSize = req.query.pageSize || 25;

      const pool = await getPool();
      const result = await pool.request()
        .input('StartDate', sql.Date, startDate)
        .input('EndDate', sql.Date, endDate)
        .input('DepartmentID', sql.Int, departmentId)
        .input('PageNumber', sql.Int, page)
        .input('PageSize', sql.Int, pageSize)
        .execute('oncall.usp_GetSchedule');

      const assignments = result.recordsets[0];
      const totalCount = result.recordsets[1]?.[0]?.TotalCount || 0;

      res.json({
        data: assignments,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      });
    } catch (err) {
      console.error('Error fetching on-call schedule:', err);
      res.status(500).json({ error: 'Failed to fetch on-call schedule.' });
    }
  }
);

// POST /api/oncall - Create on-call assignment (auth required)
// BRD 7.2: Admin can assign on-call staff
router.post('/',
  authenticate,
  requireRole('admin', 'manager'),
  [
    body('departmentId').isInt({ min: 1 }).withMessage('Department is required'),
    body('employeeId').isInt({ min: 1 }).withMessage('Employee is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('phone').notEmpty().withMessage('Phone number is required')
      .matches(/^[\d\s\-().+]+$/).withMessage('Invalid phone number format')
      .trim(),
    body('notes').optional({ nullable: true }).isString().trim()
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { departmentId, employeeId, startDate, endDate, phone, notes } = req.body;

    // Validate date range
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date.' });
    }

    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('DepartmentID', sql.Int, departmentId)
        .input('EmployeeID', sql.Int, employeeId)
        .input('StartDate', sql.Date, startDate)
        .input('EndDate', sql.Date, endDate)
        .input('Phone', sql.VarChar(20), phone)
        .input('Notes', sql.NVarChar(500), notes || null)
        .input('CreatedByEmployeeID', sql.Int, req.user.employeeId)
        .execute('oncall.usp_InsertAssignment');

      const assignmentId = result.recordset[0].AssignmentID;
      res.status(201).json({
        message: 'On-call assignment created successfully.',
        data: { assignmentId }
      });
    } catch (err) {
      console.error('Error creating on-call assignment:', err);
      res.status(500).json({ error: 'Failed to create on-call assignment.' });
    }
  }
);

// PUT /api/oncall/:id - Update assignment
// BRD 7.2: Admin can modify on-call assignments
router.put('/:id',
  authenticate,
  requireRole('admin', 'manager'),
  [
    param('id').isInt().toInt(),
    body('departmentId').isInt({ min: 1 }).withMessage('Department is required'),
    body('employeeId').isInt({ min: 1 }).withMessage('Employee is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('phone').notEmpty().withMessage('Phone number is required')
      .matches(/^[\d\s\-().+]+$/).withMessage('Invalid phone number format')
      .trim(),
    body('notes').optional({ nullable: true }).isString().trim()
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { departmentId, employeeId, startDate, endDate, phone, notes } = req.body;

    // Validate date range
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be after start date.' });
    }

    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('AssignmentID', sql.Int, req.params.id)
        .input('DepartmentID', sql.Int, departmentId)
        .input('EmployeeID', sql.Int, employeeId)
        .input('StartDate', sql.Date, startDate)
        .input('EndDate', sql.Date, endDate)
        .input('Phone', sql.VarChar(20), phone)
        .input('Notes', sql.NVarChar(500), notes || null)
        .execute('oncall.usp_UpdateAssignment');

      if (result.recordset[0].RowsAffected === 0) {
        return res.status(404).json({ error: 'Assignment not found.' });
      }

      res.json({ message: 'On-call assignment updated successfully.' });
    } catch (err) {
      console.error('Error updating on-call assignment:', err);
      res.status(500).json({ error: 'Failed to update on-call assignment.' });
    }
  }
);

// DELETE /api/oncall/:id - Remove assignment
// BRD 7.2: Admin can remove on-call assignments
router.delete('/:id',
  authenticate,
  requireRole('admin', 'manager'),
  [param('id').isInt().toInt()],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('AssignmentID', sql.Int, req.params.id)
        .execute('oncall.usp_DeleteAssignment');

      if (result.recordset[0].RowsAffected === 0) {
        return res.status(404).json({ error: 'Assignment not found.' });
      }

      res.json({ message: 'On-call assignment deleted successfully.' });
    } catch (err) {
      console.error('Error deleting on-call assignment:', err);
      res.status(500).json({ error: 'Failed to delete on-call assignment.' });
    }
  }
);

module.exports = router;
