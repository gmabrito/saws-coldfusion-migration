const router = require('express').Router();
const { body, query, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const RequestRepository = require('../repositories/requestRepository');
const aquaDocs = require('../services/aquaDocsService');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

const requestRepo = new RequestRepository();

// All internal routes require authentication
router.use(authenticate);

/**
 * GET /api/internal/requests
 * Paginated request queue with optional filters.
 */
router.get(
  '/requests',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const filters = {
        status: req.query.status,
        assignedTo: req.query.assignedToMe === 'true' ? req.user.preferred_username : req.query.assignedTo,
        overdue: req.query.overdue,
        page: req.query.page || 1,
        limit: req.query.limit || 25,
      };
      const result = await requestRepo.findAll(filters);
      res.json(result);
    } catch (err) {
      console.error('[internal/requests GET]', err.message);
      res.status(500).json({ error: 'Failed to load requests' });
    }
  }
);

/**
 * GET /api/internal/requests/:id
 * Full request detail including notes and timeline.
 */
router.get('/requests/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const request = await requestRepo.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    res.json(request);
  } catch (err) {
    console.error('[internal/requests/:id GET]', err.message);
    res.status(500).json({ error: 'Failed to load request' });
  }
});

/**
 * PUT /api/internal/requests/:id/status
 * Update request status + add audit timeline entry.
 */
router.put(
  '/requests/:id/status',
  [
    body('status')
      .isIn(['acknowledged', 'in_review', 'pending_response', 'completed', 'denied', 'partial'])
      .withMessage('Invalid status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

      await requestRepo.updateStatus(id, req.body.status, req.user.preferred_username, req.body.note);

      eventBus.publish(EVENT_TYPES.REQUEST_STATUS_UPDATED, {
        requestId: id,
        newStatus: req.body.status,
      }, req.user.preferred_username).catch(() => {});

      res.json({ success: true, status: req.body.status });
    } catch (err) {
      console.error('[internal/requests/:id/status PUT]', err.message);
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

/**
 * POST /api/internal/requests/:id/notes
 * Add internal note — not visible to the public.
 */
router.post(
  '/requests/:id/notes',
  [body('note').notEmpty().trim().withMessage('Note text is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

      await requestRepo.addNote(id, req.body.note, req.user.preferred_username);

      eventBus.publish(EVENT_TYPES.REQUEST_NOTE_ADDED, {
        requestId: id,
      }, req.user.preferred_username).catch(() => {});

      res.json({ success: true });
    } catch (err) {
      console.error('[internal/requests/:id/notes POST]', err.message);
      res.status(500).json({ error: 'Failed to add note' });
    }
  }
);

/**
 * PUT /api/internal/requests/:id/assign
 * Assign request to a staff member.
 */
router.put(
  '/requests/:id/assign',
  [body('staffEmail').isEmail().normalizeEmail().withMessage('Valid staff email required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

      await requestRepo.assign(id, req.body.staffEmail, req.user.preferred_username);

      eventBus.publish(EVENT_TYPES.REQUEST_ASSIGNED, {
        requestId: id,
        assignedTo: req.body.staffEmail,
      }, req.user.preferred_username).catch(() => {});

      res.json({ success: true });
    } catch (err) {
      console.error('[internal/requests/:id/assign PUT]', err.message);
      res.status(500).json({ error: 'Failed to assign request' });
    }
  }
);

/**
 * GET /api/internal/stats
 * Dashboard stats: open count, overdue, due this week, completed this month.
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await requestRepo.getStats();
    res.json(stats);
  } catch (err) {
    console.error('[internal/stats GET]', err.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ── AquaDocs Intelligence Layer ──────────────────────────────────────────────
// AquaRecords does not have its own document AI. All search and chat
// capabilities are proxied to the AquaDocs API (shared intelligence layer).

/**
 * POST /api/internal/intelligence/search
 * Search the SAWS document index via AquaDocs.
 *
 * Use case: Staff processing a TPIA request searches for documents
 * responsive to the request description.
 *
 * Body: { query, filters?, top? }
 * Returns: { results: [...], count: number }
 */
router.post(
  '/intelligence/search',
  [
    body('query').notEmpty().trim().withMessage('query is required'),
    body('top').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { query, filters = {}, top = 10 } = req.body;

    try {
      // Forward the caller's AD principal so AquaDocs logs the correct user
      const userToken = req.headers['x-ms-client-principal'];
      const results = await aquaDocs.searchDocuments(query, filters, top, userToken);

      eventBus.publish(EVENT_TYPES.DOCUMENT_SEARCH, {
        query,
        resultCount: results.count,
        filters,
      }, req.user?.email).catch(() => {});

      res.json(results);
    } catch (err) {
      console.error('[intelligence/search]', err.message);
      res.status(500).json({ error: 'Document search failed' });
    }
  }
);

/**
 * POST /api/internal/intelligence/chat
 * AI Q&A against the SAWS document index via AquaDocs.
 *
 * Use cases:
 *  - "Which documents are responsive to this request about X?"
 *  - "Summarize the permitting requirements for Y"
 *  - "Draft a response paragraph based on these documents"
 *
 * Body: { messages: [{role, content}, ...] }
 * Returns: { answer: string, sources: [...] }
 */
router.post(
  '/intelligence/chat',
  [body('messages').isArray({ min: 1 }).withMessage('messages array is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const userToken = req.headers['x-ms-client-principal'];
      const result = await aquaDocs.chatWithDocuments(req.body.messages, userToken);

      eventBus.publish(EVENT_TYPES.DOCUMENT_CHAT, {
        messageCount: req.body.messages.length,
      }, req.user?.email).catch(() => {});

      res.json(result);
    } catch (err) {
      console.error('[intelligence/chat]', err.message);
      res.status(500).json({ error: 'Document chat failed' });
    }
  }
);

/**
 * GET /api/internal/intelligence/health
 * Check AquaDocs service availability.
 */
router.get('/intelligence/health', async (req, res) => {
  const health = await aquaDocs.getServiceHealth();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

module.exports = router;
