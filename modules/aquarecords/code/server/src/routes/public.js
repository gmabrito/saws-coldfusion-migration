const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const RequestRepository = require('../repositories/requestRepository');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');
const { notifySubmitter } = require('../services/notificationService');

const requestRepo = new RequestRepository();

/**
 * POST /api/public/requests
 * Submit a new TPIA request. No authentication required.
 * Returns: { confirmationNo, estimatedResponseDate, message }
 */
router.post(
  '/requests',
  [
    body('requester_name').notEmpty().trim().withMessage('Name is required'),
    body('requester_email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('preferred_format').optional().isIn(['electronic', 'paper']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const created = await requestRepo.create(req.body);

      // Estimated response: due_date (10 business days + ack period)
      const estimatedResponseDate = new Date(created.due_date);
      estimatedResponseDate.setDate(estimatedResponseDate.getDate() + 10);

      eventBus.publish(EVENT_TYPES.REQUEST_SUBMITTED, {
        confirmationNo: created.confirmation_no,
        email: req.body.requester_email,
      }).catch(() => {});

      // Fire notification (stub) — no await to avoid blocking response
      notifySubmitter(
        { requester_email: req.body.requester_email, confirmation_no: created.confirmation_no },
        'submitted'
      ).catch(() => {});

      res.status(201).json({
        confirmationNo: created.confirmation_no,
        estimatedResponseDate,
        message:
          'Your request has been received. SAWS will acknowledge within 10 business days. ' +
          'Save your confirmation number to check status.',
      });
    } catch (err) {
      console.error('[public/requests POST]', err.message);
      res.status(500).json({ error: 'Failed to submit request' });
    }
  }
);

/**
 * GET /api/public/requests/:confirmationNo
 * Check request status by confirmation number. Public-safe fields only.
 * Does NOT return internal notes or staff PII.
 */
router.get(
  '/requests/:confirmationNo',
  [
    param('confirmationNo')
      .matches(/^TPIA-\d{4}-\d{6}$/)
      .withMessage('Invalid confirmation number format'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const request = await requestRepo.findByConfirmationNo(req.params.confirmationNo);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      // Strip internal fields — return only public-safe data
      res.json({
        confirmationNo: request.confirmation_no,
        status: request.status,
        submitted_at: request.submitted_at,
        acknowledged_at: request.acknowledged_at,
        due_date: request.due_date,
        assigned_department: request.assigned_department,
      });
    } catch (err) {
      console.error('[public/requests GET]', err.message);
      res.status(500).json({ error: 'Failed to retrieve request' });
    }
  }
);

module.exports = router;
