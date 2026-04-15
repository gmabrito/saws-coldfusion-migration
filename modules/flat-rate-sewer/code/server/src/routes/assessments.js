const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize, GROUPS } = require('../middleware/authorize');
const billingService = require('../services/billingService');

router.use(authenticate);

/**
 * GET /api/assessments
 * List assessments (due/completed).
 * Authorize: Admin
 */
router.get(
  '/',
  authorize([GROUPS.ADMIN]),
  async (req, res) => {
    try {
      const filters = {
        accountNum: req.query.accountNum,
        isAssessed: req.query.isAssessed !== undefined ? req.query.isAssessed === 'true' : undefined,
        type: req.query.type,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };
      const assessments = await billingService.getAssessments(filters);
      res.json(assessments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/assessments/:id
 * Get assessment detail with billing vs actual comparison.
 * Authorize: Admin
 */
router.get(
  '/:id',
  authorize([GROUPS.ADMIN]),
  [param('id').isInt().withMessage('Assessment ID must be an integer')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const detail = await billingService.getAssessmentDetail(parseInt(req.params.id, 10));
      res.json(detail);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/assessments
 * Create a new assessment.
 * Authorize: Admin
 */
router.post(
  '/',
  authorize([GROUPS.ADMIN]),
  [
    body('accountNum').notEmpty().withMessage('Account number is required'),
    body('billingDate').notEmpty().withMessage('Billing date is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const result = await billingService.createAssessment(req.body, req.user.preferred_username);
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * PUT /api/assessments/:id/review
 * Review an assessment (mark as reviewed).
 * Authorize: Admin
 */
router.put(
  '/:id/review',
  authorize([GROUPS.ADMIN]),
  [param('id').isInt().withMessage('Assessment ID must be an integer')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const result = await billingService.reviewAssessment(
        parseInt(req.params.id, 10),
        req.body,
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

/**
 * PUT /api/assessments/:id/override
 * Override assessment values.
 * Authorize: Admin
 */
router.put(
  '/:id/override',
  authorize([GROUPS.ADMIN]),
  [param('id').isInt().withMessage('Assessment ID must be an integer')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const result = await billingService.overrideAssessment(
        parseInt(req.params.id, 10),
        req.body,
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

/**
 * POST /api/assessments/progress
 * Batch mark assessments as reviewed with no changes.
 * Authorize: Admin
 */
router.post(
  '/progress',
  authorize([GROUPS.ADMIN]),
  [body('assessmentIds').isArray({ min: 1 }).withMessage('Assessment IDs array is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const results = await billingService.progressAssessments(
        req.body.assessmentIds,
        req.user.preferred_username
      );
      res.json({ progressed: results.length, results });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
