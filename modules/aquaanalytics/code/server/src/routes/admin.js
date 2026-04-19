const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
// NOTE: post-PoC — re-add: const { authorize, GROUPS } = require('../middleware/authorize');
// NOTE: post-PoC — re-add: router.use(authorize([GROUPS.ADMIN]));

router.use(authenticate);

/**
 * GET /api/internal/admin/reports
 * Report generation interface — lists available report types and generates on-demand.
 */
router.get('/reports', async (req, res) => {
  res.json({
    availableReports: [
      {
        id: 'platform-weekly',
        name: 'Platform Weekly Summary',
        description: 'Event counts, active users, module activity for the past 7 days.',
        format: 'json',
        status: 'available',
      },
      {
        id: 'aquadocs-usage',
        name: 'AquaDocs Usage Report',
        description: 'Document searches, chat queries, top queries, user breakdown.',
        format: 'json',
        status: 'available',
      },
      {
        id: 'aquarecords-sla',
        name: 'AquaRecords SLA Report',
        description: 'Open records request aging, response times, compliance status.',
        format: 'json',
        status: 'available',
      },
      {
        id: 'ai-cost',
        name: 'AI Cost Attribution Report',
        description: 'Azure OpenAI token usage and estimated cost by department/module.',
        format: 'json',
        status: 'stub — AquaAI not yet provisioned',
      },
    ],
    _note: 'POST /api/internal/admin/reports/:id to generate. Export to CSV/XLSX: post-PoC.',
  });
});

/**
 * POST /api/internal/admin/reports/:id
 * Generate a specific report (stub — returns mock data for PoC).
 */
router.post('/reports/:id', async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.body;

  res.json({
    reportId: id,
    generatedAt: new Date().toISOString(),
    period: { startDate: startDate || null, endDate: endDate || null },
    _stub: true,
    _message: `Report '${id}' generated with mock data. Connect DB to get live data.`,
    data: {
      summary: 'PoC stub — no live data yet.',
      rows: [],
    },
  });
});

module.exports = router;
