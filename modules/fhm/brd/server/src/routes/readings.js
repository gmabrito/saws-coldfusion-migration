const express = require('express');
const { body, validationResult } = require('express-validator');
const { sql, getDb } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/readings - List readings with optional filters
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getDb();
    const request = pool.request();
    let where = '1=1';

    if (req.query.contractId) {
      request.input('contractId', sql.Int, req.query.contractId);
      where += ' AND r.ContractID = @contractId';
    }

    if (req.query.month && req.query.year) {
      request.input('month', sql.Int, parseInt(req.query.month));
      request.input('year', sql.Int, parseInt(req.query.year));
      where += ' AND MONTH(r.ReadingDate) = @month AND YEAR(r.ReadingDate) = @year';
    }

    const result = await request.query(`
      SELECT r.ReadingID, r.ContractID, r.ReadingDate, r.CurrentReading,
             r.PreviousReading, r.Usage, r.MeterLocation, r.ReportedBy,
             c.BusinessName, c.ApplicantName
      FROM finance.Readings r
      INNER JOIN finance.Contracts c ON r.ContractID = c.ContractID
      WHERE ${where}
      ORDER BY r.ReadingDate DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Get readings error:', err);
    res.status(500).json({ error: 'Failed to retrieve readings.' });
  }
});

// POST /api/readings - Submit a monthly reading
router.post(
  '/',
  authenticate,
  [
    body('contractId').isInt().withMessage('Contract ID is required'),
    body('currentReading').isNumeric().withMessage('Current reading must be numeric'),
    body('previousReading').isNumeric().withMessage('Previous reading must be numeric'),
    body('meterLocation').trim().notEmpty().withMessage('Meter location is required'),
    body('reportedBy').trim().notEmpty().withMessage('Reported by is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contractId, currentReading, previousReading, meterLocation, reportedBy } = req.body;
    const usage = parseFloat(currentReading) - parseFloat(previousReading);

    try {
      const pool = await getDb();
      const result = await pool
        .request()
        .input('contractId', sql.Int, contractId)
        .input('currentReading', sql.Decimal(10, 2), parseFloat(currentReading))
        .input('previousReading', sql.Decimal(10, 2), parseFloat(previousReading))
        .input('usage', sql.Decimal(10, 2), usage)
        .input('meterLocation', sql.VarChar(200), meterLocation)
        .input('reportedBy', sql.VarChar(100), reportedBy)
        .query(`
          INSERT INTO finance.Readings
            (ContractID, ReadingDate, CurrentReading, PreviousReading, Usage, MeterLocation, ReportedBy)
          VALUES
            (@contractId, GETDATE(), @currentReading, @previousReading, @usage, @meterLocation, @reportedBy);
          SELECT SCOPE_IDENTITY() AS id;
        `);

      res.status(201).json({
        message: 'Reading submitted successfully.',
        readingId: result.recordset[0].id,
      });
    } catch (err) {
      console.error('Submit reading error:', err);
      res.status(500).json({ error: 'Failed to submit reading.' });
    }
  }
);

// GET /api/readings/report - Monthly report summary
router.get('/report', authenticate, async (req, res) => {
  try {
    const pool = await getDb();
    const request = pool.request();

    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();

    request.input('month', sql.Int, parseInt(month));
    request.input('year', sql.Int, parseInt(year));

    const result = await request.query(`
      SELECT c.ContractID, c.BusinessName, c.ApplicantName, c.MeterSize,
             r.ReadingDate, r.CurrentReading, r.PreviousReading, r.Usage,
             r.ReportedBy
      FROM finance.Contracts c
      LEFT JOIN finance.Readings r ON c.ContractID = r.ContractID
        AND MONTH(r.ReadingDate) = @month AND YEAR(r.ReadingDate) = @year
      WHERE c.Status = 'Approved'
      ORDER BY c.BusinessName
    `);

    res.json({
      month: parseInt(month),
      year: parseInt(year),
      readings: result.recordset,
    });
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Failed to generate report.' });
  }
});

module.exports = router;
