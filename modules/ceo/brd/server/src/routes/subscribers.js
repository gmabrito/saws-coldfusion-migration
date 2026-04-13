const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { getDb, sql } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

// GET /api/subscribers - List subscribers (admin only)
// BRD 7.2: Manage notification subscriptions
router.get('/',
  authenticate,
  requireRole('admin', 'ceo_staff'),
  async (req, res) => {
    try {
      const pool = await getDb();
      const result = await pool.request()
        .execute('ceo.usp_GetSubscribers');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
  }
);

// POST /api/subscribers - Subscribe to notifications (public)
// BRD 7.2: Ability to sign up for notifications
router.post('/',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('fullName').trim().isLength({ min: 1, max: 255 }).withMessage('Full name is required')
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;
    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('Email', sql.NVarChar(255), req.body.email)
        .input('FullName', sql.NVarChar(255), req.body.fullName)
        .execute('ceo.usp_InsertSubscriber');

      res.status(201).json({
        subscriberId: result.recordset[0].SubscriberID,
        message: 'Successfully subscribed to board meeting notifications'
      });
    } catch (err) {
      console.error('Error subscribing:', err);
      res.status(500).json({ error: 'Failed to subscribe' });
    }
  }
);

// DELETE /api/subscribers/:id - Unsubscribe
router.delete('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid subscriber ID')],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;
    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('SubscriberID', sql.Int, req.params.id)
        .execute('ceo.usp_DeleteSubscriber');

      if (result.recordset[0].RowsAffected === 0) {
        return res.status(404).json({ error: 'Subscriber not found' });
      }
      res.json({ message: 'Successfully unsubscribed' });
    } catch (err) {
      console.error('Error unsubscribing:', err);
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  }
);

module.exports = router;
