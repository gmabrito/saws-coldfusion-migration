const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize, GROUPS } = require('../middleware/authorize');
const accountService = require('../services/accountService');

// All account routes require authentication
router.use(authenticate);

/**
 * GET /api/accounts/search
 * Name search autocomplete.
 * Authorize: User+
 */
router.get(
  '/search',
  authorize([GROUPS.ADMIN, GROUPS.USER, GROUPS.READONLY]),
  [query('q').notEmpty().withMessage('Search term is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const results = await accountService.lookupByName(req.query.q);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/accounts
 * List accounts with search/filter/pagination.
 * Authorize: User+
 */
router.get(
  '/',
  authorize([GROUPS.ADMIN, GROUPS.USER, GROUPS.READONLY]),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        method: req.query.method,
        search: req.query.search,
      };
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 25;

      const result = await accountService.searchAccounts(filters, page, pageSize);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/accounts/:accountNum
 * Get account detail.
 * Authorize: User+
 */
router.get(
  '/:accountNum',
  authorize([GROUPS.ADMIN, GROUPS.USER, GROUPS.READONLY]),
  [param('accountNum').notEmpty()],
  async (req, res) => {
    try {
      const account = await accountService.getAccount(req.params.accountNum);
      if (!account) return res.status(404).json({ error: 'Account not found' });
      res.json(account);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/accounts
 * Create a new account.
 * Authorize: Admin
 */
router.post(
  '/',
  authorize([GROUPS.ADMIN]),
  [
    body('accountNum').notEmpty().withMessage('Account number is required'),
    body('facilityDesc').notEmpty().withMessage('Facility description is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const account = await accountService.createAccount(req.body, req.user.preferred_username);
      res.status(201).json(account);
    } catch (err) {
      if (err.message.includes('already exists')) {
        return res.status(409).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * PUT /api/accounts/:accountNum
 * Update an account.
 * Authorize: Admin
 */
router.put(
  '/:accountNum',
  authorize([GROUPS.ADMIN]),
  [param('accountNum').notEmpty()],
  async (req, res) => {
    try {
      const account = await accountService.updateAccount(
        req.params.accountNum,
        req.body,
        req.user.preferred_username
      );
      res.json(account);
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
