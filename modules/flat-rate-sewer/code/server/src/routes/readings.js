const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize, GROUPS } = require('../middleware/authorize');
const meterService = require('../services/meterService');

router.use(authenticate);

/**
 * GET /api/readings
 * List readings with filters.
 * Authorize: User+
 */
router.get(
  '/',
  authorize([GROUPS.ADMIN, GROUPS.USER, GROUPS.READONLY]),
  async (req, res) => {
    try {
      const filters = {
        accountNum: req.query.accountNum,
        serial: req.query.serial,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };
      const readings = await meterService.getReadings(filters);
      res.json(readings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/readings
 * Submit a new meter reading.
 * Authorize: User+
 */
router.post(
  '/',
  authorize([GROUPS.ADMIN, GROUPS.USER]),
  [
    body('accountNum').notEmpty().withMessage('Account number is required'),
    body('serial').notEmpty().withMessage('Serial number is required'),
    body('readingValue').isNumeric().withMessage('Reading value must be numeric'),
    body('readingDate').notEmpty().withMessage('Reading date is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const result = await meterService.submitReading(req.body, req.user.preferred_username);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * PUT /api/readings/:id
 * Edit an existing reading.
 * Authorize: Admin
 */
router.put(
  '/:id',
  authorize([GROUPS.ADMIN]),
  [param('id').isInt().withMessage('Reading ID must be an integer')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const MeterRepository = require('../repositories/meterRepository');
      const meterRepo = new MeterRepository();
      const result = await meterRepo.updateReading(parseInt(req.params.id, 10), req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/readings/recalculate
 * Recalculate readings for an account/serial.
 * Authorize: Admin
 */
router.post(
  '/recalculate',
  authorize([GROUPS.ADMIN]),
  [
    body('accountNum').notEmpty().withMessage('Account number is required'),
    body('serial').notEmpty().withMessage('Serial number is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const result = await meterService.recalculate(req.body.accountNum, req.body.serial);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
