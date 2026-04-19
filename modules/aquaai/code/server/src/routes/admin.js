const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
// NOTE: post-PoC — re-add: const { authorize, GROUPS } = require('../middleware/authorize');
// NOTE: post-PoC — re-add: router.use(authorize([GROUPS.ADMIN]));

router.use(authenticate);

// GET /api/internal/admin/budget
router.get('/budget', async (req, res) => {
  res.json({
    _stub: true,
    _message: 'Budget data will come from Azure Cost Management API post-PoC',
    budgetLimits: [
      { department: 'Operations',  monthlyLimit: 500,  currentSpend: 0,   currency: 'USD' },
      { department: 'Engineering', monthlyLimit: 300,  currentSpend: 0,   currency: 'USD' },
      { department: 'Compliance',  monthlyLimit: 200,  currentSpend: 0,   currency: 'USD' },
      { department: 'IS',          monthlyLimit: 1000, currentSpend: 0,   currency: 'USD' },
      { department: 'All Modules', monthlyLimit: 2000, currentSpend: 0,   currency: 'USD' },
    ],
    billingPeriod: new Date().toISOString().slice(0, 7),
    note: 'Azure OpenAI not yet configured — all spend is $0 in PoC.',
  });
});

module.exports = router;
