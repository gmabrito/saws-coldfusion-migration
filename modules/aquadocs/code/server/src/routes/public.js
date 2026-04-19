const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const azureSearch = require('../services/azureSearchService');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

// PoC: All routes require Azure AD authentication.
// Post-PoC: remove router.use(authenticate) to open public search to SAWS.org visitors.
router.use(authenticate);

/**
 * POST /api/public/search
 * Document search — PoC: AD auth required. Post-PoC: public keyword-only search.
 */
router.post(
  '/search',
  [
    body('query').notEmpty().withMessage('query is required').trim(),
    body('top').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { query, top = 10 } = req.body;

    try {
      const results = await azureSearch.publicSearch(query, top);

      // Log the public search (no userId)
      eventBus.publish(EVENT_TYPES.PUBLIC_SEARCH, { query, resultCount: results.count }).catch(() => {});

      res.json(results);
    } catch (err) {
      console.error('[public/search]', err.message);
      res.status(500).json({ error: 'Search failed' });
    }
  }
);

module.exports = router;
