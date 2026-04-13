const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { sql, getDb } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/contracts - List contracts with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getDb();
    const request = pool.request();
    let where = '1=1';

    if (req.query.status) {
      request.input('status', sql.VarChar(20), req.query.status);
      where += ' AND c.Status = @status';
    }

    const result = await request.query(`
      SELECT c.ContractID, c.ApplicantName, c.BusinessName, c.Email, c.Phone,
             c.MeterSize, c.MeterLocation, c.Status, c.ApplicationDate,
             c.ApprovedDate, c.ApprovedByEmployeeID,
             e.FirstName + ' ' + e.LastName AS ApprovedByName
      FROM finance.Contracts c
      LEFT JOIN dbo.Employees e ON c.ApprovedByEmployeeID = e.EmployeeID
      WHERE ${where}
      ORDER BY c.ApplicationDate DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Get contracts error:', err);
    res.status(500).json({ error: 'Failed to retrieve contracts.' });
  }
});

// GET /api/contracts/:id - Get contract detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT c.*, e.FirstName + ' ' + e.LastName AS ApprovedByName
        FROM finance.Contracts c
        LEFT JOIN dbo.Employees e ON c.ApprovedByEmployeeID = e.EmployeeID
        WHERE c.ContractID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Contract not found.' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Get contract error:', err);
    res.status(500).json({ error: 'Failed to retrieve contract.' });
  }
});

// POST /api/contracts - Submit new contract application (public-facing)
router.post(
  '/',
  [
    body('applicantName').trim().notEmpty().withMessage('Applicant name is required'),
    body('businessName').trim().notEmpty().withMessage('Business name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('meterSize').trim().notEmpty().withMessage('Meter size is required'),
    body('meterLocation').trim().notEmpty().withMessage('Meter location is required'),
    body('projectDescription').trim().notEmpty().withMessage('Project description is required'),
    body('estimatedDuration').trim().notEmpty().withMessage('Estimated duration is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      applicantName, businessName, email, phone,
      meterSize, meterLocation, projectDescription, estimatedDuration
    } = req.body;

    try {
      const pool = await getDb();
      const result = await pool
        .request()
        .input('applicantName', sql.VarChar(100), applicantName)
        .input('businessName', sql.VarChar(100), businessName)
        .input('email', sql.VarChar(100), email)
        .input('phone', sql.VarChar(20), phone)
        .input('meterSize', sql.VarChar(20), meterSize)
        .input('meterLocation', sql.VarChar(200), meterLocation)
        .input('projectDescription', sql.NVarChar(sql.MAX), projectDescription)
        .input('estimatedDuration', sql.VarChar(50), estimatedDuration)
        .query(`
          INSERT INTO finance.Contracts
            (ApplicantName, BusinessName, Email, Phone, MeterSize, MeterLocation,
             ProjectDescription, EstimatedDuration, Status, ApplicationDate)
          VALUES
            (@applicantName, @businessName, @email, @phone, @meterSize, @meterLocation,
             @projectDescription, @estimatedDuration, 'Pending', GETDATE());
          SELECT SCOPE_IDENTITY() AS id;
        `);

      res.status(201).json({
        message: 'Application submitted successfully. You will receive an email notification when approved.',
        contractId: result.recordset[0].id,
      });
    } catch (err) {
      console.error('Create contract error:', err);
      res.status(500).json({ error: 'Failed to submit application.' });
    }
  }
);

// PUT /api/contracts/:id/review - Admin review (approve/deny)
router.put(
  '/:id/review',
  authenticate,
  requireRole('ADMIN'),
  [
    body('status').isIn(['Approved', 'Denied']).withMessage('Status must be Approved or Denied'),
    body('reviewNotes').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, reviewNotes } = req.body;

    try {
      const pool = await getDb();
      await pool
        .request()
        .input('id', sql.Int, req.params.id)
        .input('status', sql.VarChar(20), status)
        .input('reviewNotes', sql.NVarChar(sql.MAX), reviewNotes || null)
        .input('approvedBy', sql.Int, req.user.employeeId)
        .query(`
          UPDATE finance.Contracts
          SET Status = @status,
              ReviewNotes = @reviewNotes,
              ApprovedByEmployeeID = @approvedBy,
              ApprovedDate = GETDATE(),
              ModifiedDate = GETDATE()
          WHERE ContractID = @id
        `);

      res.json({ message: `Contract ${status.toLowerCase()} successfully.` });
    } catch (err) {
      console.error('Review contract error:', err);
      res.status(500).json({ error: 'Failed to review contract.' });
    }
  }
);

module.exports = router;
