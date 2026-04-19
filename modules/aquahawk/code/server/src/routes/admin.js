const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
// NOTE: post-PoC — re-add: const { authorize, GROUPS } = require('../middleware/authorize');
// NOTE: post-PoC — re-add: router.use(authorize([GROUPS.ADMIN]));

router.use(authenticate);

// GET /api/internal/admin/config
router.get('/config', async (req, res) => {
  res.json({
    module: 'aquahawk',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    aquadocsApiUrl: process.env.AQUADOCS_API_URL || 'http://localhost:3030',
    aquarecordsApiUrl: process.env.AQUARECORDS_API_URL || 'http://localhost:3031',
    eventhouseUrl: process.env.EVENTHOUSE_URL || null,
    adGroups: {
      admin: 'SAWS-AquaHawk-Admin',
      viewer: 'SAWS-AquaHawk-Viewer',
    },
  });
});

module.exports = router;
