const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── Stub data ────────────────────────────────────────────────────────────────

const stubTemplates = [
  {
    id: 1,
    name: 'Critical Incident Alert',
    teams: ['Operations', 'EOC', 'Executive'],
    subject: '[CRITICAL] SITREP-{number}: {type} at {facility}',
    body: 'A critical incident has been reported at {facility}. Type: {type}. Immediate action required.',
    _stub: true,
  },
  {
    id: 2,
    name: 'High Severity Notification',
    teams: ['Operations', 'EOC'],
    subject: '[HIGH] SITREP-{number}: {type} at {facility}',
    body: 'A high severity incident has been reported at {facility}. Type: {type}. Please review and respond.',
    _stub: true,
  },
  {
    id: 3,
    name: 'IT & Systems Alert',
    teams: ['IT'],
    subject: '[SITREP] Systems Incident: {type} at {facility}',
    body: 'An IT-related incident has been logged. Facility: {facility}. Type: {type}. Please assess impact.',
    _stub: true,
  },
  {
    id: 4,
    name: 'Resolution Notice',
    teams: ['Operations', 'EOC', 'Executive'],
    subject: '[RESOLVED] SITREP-{number}: {type} at {facility}',
    body: 'The following incident has been resolved. SITREP: {number}. Facility: {facility}. Type: {type}.',
    _stub: true,
  },
];

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/notifications/templates
 * List notification templates.
 */
router.get('/templates', (req, res) => {
  res.json(stubTemplates);
});

/**
 * POST /api/notifications/send
 * Stub: log a notification send request.
 */
router.post('/send', (req, res) => {
  const { sitrep_id, template_id, teams } = req.body;
  console.log(`[STUB] Notification send requested — sitrep: ${sitrep_id}, template: ${template_id}, teams: ${teams}`);
  res.json({
    sent: true,
    sitrep_id,
    template_id,
    teams: teams || [],
    sent_at: new Date().toISOString(),
    _stub: true,
  });
});

module.exports = router;
