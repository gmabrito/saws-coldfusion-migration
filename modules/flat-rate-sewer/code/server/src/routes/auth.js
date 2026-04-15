const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { login } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Authenticate and receive a JWT token.
 */
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return login(req, res);
  }
);

module.exports = router;
