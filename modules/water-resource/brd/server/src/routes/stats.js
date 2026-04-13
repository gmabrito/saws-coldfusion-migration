const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { sql, getPool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper: return validation errors
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
}

// BRD 7.1: Display 30-day aquifer stats summary
// GET /api/stats
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .execute('waterresource.usp_Get30DaySummary');

    // Return summary object with latest readings and 30-day averages
    res.json({ data: result.recordset });
  } catch (err) {
    console.error('Error fetching 30-day stats summary:', err);
    res.status(500).json({ error: 'Failed to fetch aquifer stats summary.' });
  }
});

// BRD 7.1: Get daily readings with date range filter
// GET /api/stats/daily?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/daily',
  [
    query('startDate').optional().isISO8601().withMessage('startDate must be a valid date (YYYY-MM-DD).'),
    query('endDate').optional().isISO8601().withMessage('endDate must be a valid date (YYYY-MM-DD).')
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const pool = await getPool();
      const request = pool.request();

      // Default to last 30 days if no dates provided
      const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
      const startDate = req.query.startDate || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
      })();

      request.input('StartDate', sql.Date, startDate);
      request.input('EndDate', sql.Date, endDate);

      const result = await request.execute('waterresource.usp_GetDailyReadings');
      res.json({ data: result.recordset, startDate, endDate });
    } catch (err) {
      console.error('Error fetching daily readings:', err);
      res.status(500).json({ error: 'Failed to fetch daily readings.' });
    }
  }
);

// BRD 7.1: Get water levels by county
// GET /api/stats/counties
router.get('/counties', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .execute('waterresource.usp_GetCountyWaterLevels');

    res.json({ data: result.recordset });
  } catch (err) {
    console.error('Error fetching county water levels:', err);
    res.status(500).json({ error: 'Failed to fetch county water levels.' });
  }
});

// BRD 7.1: Add daily reading (manual data entry, auth required)
// POST /api/stats/daily
router.post('/daily',
  authenticate,
  requireRole('admin', 'operator'),
  [
    body('readingDate').notEmpty().isISO8601().withMessage('Reading date is required (YYYY-MM-DD).'),
    body('bexarLevel').notEmpty().isFloat({ min: 0 }).withMessage('Bexar level must be a positive number.'),
    body('medinaLevel').notEmpty().isFloat({ min: 0 }).withMessage('Medina level must be a positive number.'),
    body('uvaldeLevel').notEmpty().isFloat({ min: 0 }).withMessage('Uvalde level must be a positive number.'),
    body('comalLevel').notEmpty().isFloat({ min: 0 }).withMessage('Comal level must be a positive number.'),
    body('haysLevel').notEmpty().isFloat({ min: 0 }).withMessage('Hays level must be a positive number.'),
    body('precipitation').notEmpty().isFloat({ min: 0 }).withMessage('Precipitation must be a non-negative number.'),
    body('temperatureHigh').notEmpty().isFloat().withMessage('Temperature high is required.'),
    body('temperatureLow').notEmpty().isFloat().withMessage('Temperature low is required.'),
    body('totalPumpage').notEmpty().isFloat({ min: 0 }).withMessage('Total pumpage must be a non-negative number.')
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const pool = await getPool();
      const {
        readingDate, bexarLevel, medinaLevel, uvaldeLevel,
        comalLevel, haysLevel, precipitation,
        temperatureHigh, temperatureLow, totalPumpage
      } = req.body;

      const result = await pool.request()
        .input('ReadingDate', sql.Date, readingDate)
        .input('BexarLevel', sql.Decimal(10, 2), bexarLevel)
        .input('MedinaLevel', sql.Decimal(10, 2), medinaLevel)
        .input('UvaldeLevel', sql.Decimal(10, 2), uvaldeLevel)
        .input('ComalLevel', sql.Decimal(10, 2), comalLevel)
        .input('HaysLevel', sql.Decimal(10, 2), haysLevel)
        .input('Precipitation', sql.Decimal(6, 2), precipitation)
        .input('TemperatureHigh', sql.Decimal(5, 1), temperatureHigh)
        .input('TemperatureLow', sql.Decimal(5, 1), temperatureLow)
        .input('TotalPumpage', sql.Decimal(12, 2), totalPumpage)
        .input('EnteredByEmployeeID', sql.Int, req.user.employeeId)
        .execute('waterresource.usp_InsertDailyReading');

      const newReading = result.recordset[0];
      res.status(201).json({ data: newReading, message: 'Daily reading added successfully.' });
    } catch (err) {
      // Handle duplicate date constraint
      if (err.number === 2627 || err.number === 2601) {
        return res.status(409).json({ error: 'A reading for this date already exists.' });
      }
      console.error('Error adding daily reading:', err);
      res.status(500).json({ error: 'Failed to add daily reading.' });
    }
  }
);

// BRD 7.1: Update daily reading
// PUT /api/stats/daily/:id
router.put('/daily/:id',
  authenticate,
  requireRole('admin', 'operator'),
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid reading ID.'),
    body('readingDate').optional().isISO8601().withMessage('Reading date must be a valid date (YYYY-MM-DD).'),
    body('bexarLevel').optional().isFloat({ min: 0 }).withMessage('Bexar level must be a positive number.'),
    body('medinaLevel').optional().isFloat({ min: 0 }).withMessage('Medina level must be a positive number.'),
    body('uvaldeLevel').optional().isFloat({ min: 0 }).withMessage('Uvalde level must be a positive number.'),
    body('comalLevel').optional().isFloat({ min: 0 }).withMessage('Comal level must be a positive number.'),
    body('haysLevel').optional().isFloat({ min: 0 }).withMessage('Hays level must be a positive number.'),
    body('precipitation').optional().isFloat({ min: 0 }).withMessage('Precipitation must be a non-negative number.'),
    body('temperatureHigh').optional().isFloat().withMessage('Temperature high must be a number.'),
    body('temperatureLow').optional().isFloat().withMessage('Temperature low must be a number.'),
    body('totalPumpage').optional().isFloat({ min: 0 }).withMessage('Total pumpage must be a non-negative number.')
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const pool = await getPool();
      const {
        readingDate, bexarLevel, medinaLevel, uvaldeLevel,
        comalLevel, haysLevel, precipitation,
        temperatureHigh, temperatureLow, totalPumpage
      } = req.body;

      const request = pool.request()
        .input('ReadingID', sql.Int, req.params.id)
        .input('EnteredByEmployeeID', sql.Int, req.user.employeeId);

      // Only set fields that were provided
      if (readingDate !== undefined) request.input('ReadingDate', sql.Date, readingDate);
      if (bexarLevel !== undefined) request.input('BexarLevel', sql.Decimal(10, 2), bexarLevel);
      if (medinaLevel !== undefined) request.input('MedinaLevel', sql.Decimal(10, 2), medinaLevel);
      if (uvaldeLevel !== undefined) request.input('UvaldeLevel', sql.Decimal(10, 2), uvaldeLevel);
      if (comalLevel !== undefined) request.input('ComalLevel', sql.Decimal(10, 2), comalLevel);
      if (haysLevel !== undefined) request.input('HaysLevel', sql.Decimal(10, 2), haysLevel);
      if (precipitation !== undefined) request.input('Precipitation', sql.Decimal(6, 2), precipitation);
      if (temperatureHigh !== undefined) request.input('TemperatureHigh', sql.Decimal(5, 1), temperatureHigh);
      if (temperatureLow !== undefined) request.input('TemperatureLow', sql.Decimal(5, 1), temperatureLow);
      if (totalPumpage !== undefined) request.input('TotalPumpage', sql.Decimal(12, 2), totalPumpage);

      const result = await request.execute('waterresource.usp_UpdateDailyReading');

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Reading not found.' });
      }

      res.json({ data: result.recordset[0], message: 'Daily reading updated successfully.' });
    } catch (err) {
      if (err.number === 2627 || err.number === 2601) {
        return res.status(409).json({ error: 'A reading for this date already exists.' });
      }
      console.error('Error updating daily reading:', err);
      res.status(500).json({ error: 'Failed to update daily reading.' });
    }
  }
);

module.exports = router;
