const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize, GROUPS } = require('../middleware/authorize');
const meterService = require('../services/meterService');

router.use(authenticate);

/**
 * GET /api/meters/:accountNum
 * List meters for an account.
 * Authorize: User+
 */
router.get(
  '/:accountNum',
  authorize([GROUPS.ADMIN, GROUPS.USER, GROUPS.READONLY]),
  [param('accountNum').notEmpty()],
  async (req, res) => {
    try {
      const meters = await meterService.getMeters(req.params.accountNum);
      res.json(meters);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/meters
 * Add a new meter.
 * Authorize: Admin
 */
router.post(
  '/',
  authorize([GROUPS.ADMIN]),
  [
    body('accountNum').notEmpty().withMessage('Account number is required'),
    body('serial').notEmpty().withMessage('Serial number is required'),
    body('functionType')
      .notEmpty()
      .isIn(['MAKEUP', 'BLOWDOWN', 'LOSS', 'SEWER', 'INCOMING'])
      .withMessage('Function type must be MAKEUP, BLOWDOWN, LOSS, SEWER, or INCOMING'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const result = await meterService.addMeter(req.body, req.user.preferred_username);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * PUT /api/meters/:id/deactivate
 * Deactivate a meter.
 * Authorize: Admin
 */
router.put(
  '/:id/deactivate',
  authorize([GROUPS.ADMIN]),
  [param('id').isInt().withMessage('Meter ID must be an integer')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const result = await meterService.deactivateMeter(
        parseInt(req.params.id, 10),
        req.user.preferred_username
      );
      res.json(result);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
