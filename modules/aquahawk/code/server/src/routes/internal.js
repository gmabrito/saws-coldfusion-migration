const router = require('express').Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { getDb, sql } = require('../config/database');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

// All internal routes require authentication
router.use(authenticate);

const AQUADOCS_URL = process.env.AQUADOCS_API_URL || 'http://localhost:3030';
const AQUARECORDS_URL = process.env.AQUARECORDS_API_URL || 'http://localhost:3031';

// Static module registry
const MODULE_REGISTRY = [
  { id: 'aquadocs',     name: 'AquaDocs',     description: 'Document AI & Knowledge Base',         port: 3030, url: AQUADOCS_URL,    status: 'unknown', version: '1.0.0' },
  { id: 'aquarecords',  name: 'AquaRecords',  description: 'Open Records Request Management',       port: 3031, url: AQUARECORDS_URL, status: 'unknown', version: '1.0.0' },
  { id: 'aquahawk',     name: 'AquaHawk',     description: 'Platform Operations Dashboard',         port: 3032, url: 'http://localhost:3032', status: 'ok', version: '1.0.0' },
  { id: 'aquaai',       name: 'AquaAI',       description: 'Shared AI Services Layer',              port: 3033, url: 'http://localhost:3033', status: 'unknown', version: '1.0.0' },
  { id: 'aquaanalytics',name: 'AquaAnalytics','description': 'Cross-Module Analytics & Reporting',  port: 3034, url: 'http://localhost:3034', status: 'unknown', version: '1.0.0' },
];

async function probeHealth(url, moduleName) {
  try {
    const resp = await axios.get(`${url}/api/health`, { timeout: 3000 });
    return { status: resp.data.status || 'ok', data: resp.data };
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return { status: 'offline', error: `${moduleName} not reachable (ECONNREFUSED)` };
    }
    return { status: 'error', error: err.message };
  }
}

/**
 * GET /api/internal/platform/health
 * Polls AquaDocs and AquaRecords health endpoints, returns aggregated status.
 */
router.get('/platform/health', async (req, res) => {
  const [docsHealth, recordsHealth] = await Promise.all([
    probeHealth(AQUADOCS_URL, 'AquaDocs'),
    probeHealth(AQUARECORDS_URL, 'AquaRecords'),
  ]);

  const modules = {
    aquadocs:    { ...docsHealth,    url: AQUADOCS_URL },
    aquarecords: { ...recordsHealth, url: AQUARECORDS_URL },
    aquahawk:    { status: 'ok', url: 'http://localhost:3032' },
  };

  const allOk = Object.values(modules).every((m) => m.status === 'ok');
  const anyError = Object.values(modules).some((m) => m.status === 'error' || m.status === 'offline');

  const overall = allOk ? 'ok' : anyError ? 'degraded' : 'partial';

  eventBus.publish(EVENT_TYPES.PLATFORM_HEALTH_CHECKED, { overall, modules }, req.user?.preferred_username).catch(() => {});

  res.json({ overall, modules, checkedAt: new Date().toISOString() });
});

/**
 * GET /api/internal/platform/events
 * Returns recent 50 events across all types from aquahawk.event_log.
 */
router.get('/platform/events', async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(
      `SELECT TOP 50 event_id, event_type, payload, user_id, created_at
       FROM aquahawk.event_log
       ORDER BY created_at DESC`
    );

    eventBus.publish(EVENT_TYPES.EVENTS_QUERIED, { count: result.recordset.length }, req.user?.preferred_username).catch(() => {});

    res.json({ events: result.recordset, total: result.recordset.length });
  } catch (err) {
    console.error('[platform/events]', err.message);
    // Return mock data when DB not yet provisioned
    res.json({
      events: getMockEvents(),
      total: 10,
      _stub: true,
      _message: 'DB not reachable — showing mock data',
    });
  }
});

/**
 * GET /api/internal/platform/stats
 * Event counts by type for last 24h and last 7d.
 */
router.get('/platform/stats', async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(
      `SELECT
         event_type,
         COUNT(CASE WHEN created_at >= DATEADD(HOUR, -24, GETDATE()) THEN 1 END) AS last_24h,
         COUNT(CASE WHEN created_at >= DATEADD(DAY,  -7,  GETDATE()) THEN 1 END) AS last_7d,
         COUNT(*) AS total
       FROM aquahawk.event_log
       GROUP BY event_type
       ORDER BY last_24h DESC`
    );

    eventBus.publish(EVENT_TYPES.STATS_QUERIED, {}, req.user?.preferred_username).catch(() => {});

    res.json({ stats: result.recordset, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[platform/stats]', err.message);
    res.json({
      stats: getMockStats(),
      generatedAt: new Date().toISOString(),
      _stub: true,
      _message: 'DB not reachable — showing mock data',
    });
  }
});

/**
 * GET /api/internal/platform/modules
 * Static module registry with live health status probed.
 */
router.get('/platform/modules', async (req, res) => {
  const healthChecks = await Promise.all(
    MODULE_REGISTRY.filter((m) => m.id !== 'aquahawk').map(async (mod) => {
      const health = await probeHealth(mod.url, mod.name);
      return { ...mod, status: health.status, healthData: health.data };
    })
  );

  const modules = [
    ...healthChecks,
    { ...MODULE_REGISTRY.find((m) => m.id === 'aquahawk'), status: 'ok' },
  ].sort((a, b) => a.port - b.port);

  res.json({ modules, checkedAt: new Date().toISOString() });
});

/**
 * GET /api/internal/intelligence/health
 * Proxies to AquaDocs intelligence health (Azure AI Search + OpenAI status).
 */
router.get('/intelligence/health', async (req, res) => {
  try {
    const resp = await axios.get(`${AQUADOCS_URL}/api/health`, { timeout: 3000 });
    res.json({ source: 'aquadocs', ...resp.data });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.json({ source: 'aquadocs', status: 'offline', error: 'AquaDocs not reachable', _stub: true });
    }
    res.status(502).json({ error: 'Failed to proxy intelligence health', details: err.message });
  }
});

// ---- Mock data helpers ----
function getMockEvents() {
  const now = new Date();
  return [
    { event_id: 'e1', event_type: 'hawk.platform.health_checked', payload: '{"overall":"ok"}', user_id: 'demo@saws.org', created_at: new Date(now - 60000) },
    { event_id: 'e2', event_type: 'aquadocs.document.search',      payload: '{"query":"pump maintenance"}', user_id: 'jsmith@saws.org', created_at: new Date(now - 180000) },
    { event_id: 'e3', event_type: 'aquadocs.chat.query',            payload: '{"query":"valve inspection SOP"}', user_id: 'jsmith@saws.org', created_at: new Date(now - 300000) },
    { event_id: 'e4', event_type: 'api.request',                    payload: '{"method":"GET","path":"/api/internal/platform/health","status":200}', user_id: 'demo@saws.org', created_at: new Date(now - 420000) },
    { event_id: 'e5', event_type: 'hawk.stats.queried',             payload: '{}', user_id: 'mjones@saws.org', created_at: new Date(now - 600000) },
    { event_id: 'e6', event_type: 'aquadocs.document.search',       payload: '{"query":"water main break"}', user_id: 'bwilliams@saws.org', created_at: new Date(now - 900000) },
    { event_id: 'e7', event_type: 'api.request',                    payload: '{"method":"POST","path":"/api/internal/search","status":200}', user_id: 'jsmith@saws.org', created_at: new Date(now - 1200000) },
    { event_id: 'e8', event_type: 'hawk.platform.health_checked',   payload: '{"overall":"degraded"}', user_id: null, created_at: new Date(now - 1800000) },
    { event_id: 'e9', event_type: 'aquadocs.chat.query',            payload: '{"query":"chlorine dosing procedure"}', user_id: 'mjones@saws.org', created_at: new Date(now - 2400000) },
    { event_id: 'e10', event_type: 'api.request',                   payload: '{"method":"GET","path":"/api/internal/platform/modules","status":200}', user_id: 'demo@saws.org', created_at: new Date(now - 3600000) },
  ];
}

function getMockStats() {
  return [
    { event_type: 'api.request',                   last_24h: 147, last_7d: 892,  total: 4201 },
    { event_type: 'aquadocs.document.search',       last_24h: 38,  last_7d: 224,  total: 1089 },
    { event_type: 'aquadocs.chat.query',            last_24h: 21,  last_7d: 130,  total: 612  },
    { event_type: 'hawk.platform.health_checked',   last_24h: 18,  last_7d: 112,  total: 540  },
    { event_type: 'hawk.module.status_changed',     last_24h: 3,   last_7d: 14,   total: 67   },
    { event_type: 'user.access_denied',             last_24h: 1,   last_7d: 4,    total: 23   },
  ];
}

module.exports = router;
