const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { sql, getDb } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/jobs - list print jobs (filter by status, department)
router.get('/', async (req, res) => {
  try {
    const pool = await getDb();
    const request = pool.request();

    let where = [];
    if (req.query.status) {
      request.input('status', sql.NVarChar, req.query.status);
      where.push('pj.Status = @status');
    }
    if (req.query.departmentId) {
      request.input('departmentId', sql.Int, parseInt(req.query.departmentId));
      where.push('pj.DepartmentID = @departmentId');
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const result = await request.query(`
      SELECT pj.JobID, pj.Title, pj.Quantity, pj.PaperSize, pj.ColorType,
             pj.RushOrder, pj.Status, pj.RequestDate, pj.CompletedDate,
             d.DepartmentName, e.FirstName + ' ' + e.LastName AS RequestedBy
      FROM printshop.PrintJobs pj
      LEFT JOIN dbo.Departments d ON pj.DepartmentID = d.DepartmentID
      LEFT JOIN dbo.Employees e ON pj.RequestedByEmployeeID = e.EmployeeID
      ${whereClause}
      ORDER BY pj.RequestDate DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Failed to fetch print jobs' });
  }
});

// GET /api/jobs/:id - get job detail
router.get('/:id',
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query(`
          SELECT pj.*, d.DepartmentName,
                 e.FirstName + ' ' + e.LastName AS RequestedBy,
                 e.Email AS RequestedByEmail
          FROM printshop.PrintJobs pj
          LEFT JOIN dbo.Departments d ON pj.DepartmentID = d.DepartmentID
          LEFT JOIN dbo.Employees e ON pj.RequestedByEmployeeID = e.EmployeeID
          WHERE pj.JobID = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Print job not found' });
      }
      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Error fetching job:', err);
      res.status(500).json({ error: 'Failed to fetch print job' });
    }
  }
);

// POST /api/jobs - submit print job request (auth required)
router.post('/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('paperSize').trim().notEmpty().withMessage('Paper size is required'),
    body('colorType').isIn(['Color', 'Black & White']).withMessage('Invalid color type'),
    body('departmentId').isInt().withMessage('Department is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pool = await getDb();
      const { title, description, quantity, paperSize, colorType, departmentId, rushOrder, notes } = req.body;

      const result = await pool.request()
        .input('title', sql.NVarChar, title)
        .input('description', sql.NVarChar, description || null)
        .input('quantity', sql.Int, quantity)
        .input('paperSize', sql.NVarChar, paperSize)
        .input('colorType', sql.NVarChar, colorType)
        .input('departmentId', sql.Int, departmentId)
        .input('employeeId', sql.Int, req.user.employeeId)
        .input('rushOrder', sql.Bit, rushOrder ? 1 : 0)
        .input('notes', sql.NVarChar, notes || null)
        .query(`
          INSERT INTO printshop.PrintJobs
            (Title, Description, Quantity, PaperSize, ColorType, DepartmentID,
             RequestedByEmployeeID, RushOrder, Status, RequestDate, Notes, CreatedDate)
          OUTPUT INSERTED.JobID
          VALUES
            (@title, @description, @quantity, @paperSize, @colorType, @departmentId,
             @employeeId, @rushOrder, 'Submitted', GETDATE(), @notes, GETDATE())
        `);

      res.status(201).json({ jobId: result.recordset[0].JobID, message: 'Print job submitted successfully' });
    } catch (err) {
      console.error('Error creating job:', err);
      res.status(500).json({ error: 'Failed to submit print job' });
    }
  }
);

// PUT /api/jobs/:id - update job status
router.put('/:id',
  authenticate,
  param('id').isInt(),
  body('status').isIn(['Submitted', 'InProgress', 'Completed', 'Cancelled']).withMessage('Invalid status'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pool = await getDb();
      const { status, notes } = req.body;

      let completedDate = status === 'Completed' ? 'GETDATE()' : 'NULL';

      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('status', sql.NVarChar, status)
        .input('notes', sql.NVarChar, notes || null)
        .query(`
          UPDATE printshop.PrintJobs
          SET Status = @status,
              Notes = COALESCE(@notes, Notes),
              CompletedDate = ${completedDate}
          WHERE JobID = @id;
          SELECT @@ROWCOUNT AS affected;
        `);

      if (result.recordset[0].affected === 0) {
        return res.status(404).json({ error: 'Print job not found' });
      }
      res.json({ message: 'Print job updated successfully' });
    } catch (err) {
      console.error('Error updating job:', err);
      res.status(500).json({ error: 'Failed to update print job' });
    }
  }
);

// DELETE /api/jobs/:id - cancel job
router.delete('/:id',
  authenticate,
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query(`
          UPDATE printshop.PrintJobs
          SET Status = 'Cancelled'
          WHERE JobID = @id AND Status NOT IN ('Completed', 'Cancelled');
          SELECT @@ROWCOUNT AS affected;
        `);

      if (result.recordset[0].affected === 0) {
        return res.status(404).json({ error: 'Print job not found or already completed/cancelled' });
      }
      res.json({ message: 'Print job cancelled successfully' });
    } catch (err) {
      console.error('Error cancelling job:', err);
      res.status(500).json({ error: 'Failed to cancel print job' });
    }
  }
);

module.exports = router;
