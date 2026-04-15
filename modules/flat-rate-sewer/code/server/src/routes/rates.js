const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize, GROUPS } = require('../middleware/authorize');
const rateService = require('../services/rateService');

router.use(authenticate);

/**
 * GET /api/rates
 * Get current rates.
 * Authorize: User+
 */
router.get(
  '/',
  authorize([GROUPS.ADMIN, GROUPS.USER, GROUPS.READONLY]),
  async (req, res) => {
    try {
      const effectiveDate = req.query.effectiveDate || new Date();
      const [rates, minimumCharges, tiers] = await Promise.all([
        rateService.getRates(effectiveDate),
        rateService.getMinimumCharges(effectiveDate),
        rateService.getRateTiers(effectiveDate),
      ]);

      res.json({
        effectiveDate,
        rates,
        minimumCharges,
        tiers,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/rates/:effectiveDate
 * Get rates for a specific effective date.
 * Authorize: Admin
 */
router.get(
  '/:effectiveDate',
  authorize([GROUPS.ADMIN]),
  [param('effectiveDate').isISO8601().withMessage('Effective date must be a valid ISO date')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const effectiveDate = req.params.effectiveDate;
      const [rates, minimumCharges, tiers] = await Promise.all([
        rateService.getRates(effectiveDate),
        rateService.getMinimumCharges(effectiveDate),
        rateService.getRateTiers(effectiveDate),
      ]);

      res.json({
        effectiveDate,
        rates,
        minimumCharges,
        tiers,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/rates
 * Set a new rate value.
 * Authorize: Admin
 */
router.post(
  '/',
  authorize([GROUPS.ADMIN]),
  [
    body('key').notEmpty().withMessage('Rate key is required'),
    body('value').notEmpty().withMessage('Rate value is required'),
    body('effectiveDate').isISO8601().withMessage('Effective date must be a valid ISO date'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const result = await rateService.setRate(
        req.body.key,
        req.body.value,
        req.body.effectiveDate,
        req.user.preferred_username
      );
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
