const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getDb, sql } = require('../config/database');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

// All internal routes require authentication
router.use(authenticate);

/**
 * GET /api/internal/analytics/overview
 * Summary stats: total events today, active users, module activity counts.
 * Cross-schema reads: aquadocs.event_log + aquarecords.event_log + aquaanalytics.event_log
 */
router.get('/analytics/overview', async (req, res) => {
  try {
    const pool = await getDb();

    // Cross-schema unified event count
    const result = await pool.request().query(`
      SELECT
        COUNT(*) AS total_events_today,
        COUNT(DISTINCT user_id) AS active_users_today
      FROM (
        SELECT user_id FROM aquadocs.event_log     WHERE created_at >= CAST(GETDATE() AS DATE)
        UNION ALL
        SELECT user_id FROM aquarecords.event_log  WHERE created_at >= CAST(GETDATE() AS DATE)
        UNION ALL
        SELECT user_id FROM aquaanalytics.event_log WHERE created_at >= CAST(GETDATE() AS DATE)
      ) combined
    `);

    const docsResult = await pool.request().query(`
      SELECT COUNT(*) AS searches_today
      FROM aquadocs.event_log
      WHERE event_type IN ('aquadocs.document.search', 'aquadocs.chat.query')
        AND created_at >= CAST(GETDATE() AS DATE)
    `);

    const recordsResult = await pool.request().query(`
      SELECT COUNT(*) AS requests_today
      FROM aquarecords.event_log
      WHERE created_at >= CAST(GETDATE() AS DATE)
    `);

    eventBus.publish(EVENT_TYPES.OVERVIEW_QUERIED, {}, req.user?.preferred_username).catch(() => {});

    res.json({
      totalEventsToday: result.recordset[0].total_events_today,
      activeUsersToday: result.recordset[0].active_users_today,
      aquaDocsSearchesToday: docsResult.recordset[0].searches_today,
      aquaRecordsRequestsToday: recordsResult.recordset[0].requests_today,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[analytics/overview]', err.message);
    res.json(getMockOverview());
  }
});

/**
 * GET /api/internal/analytics/events
 * Event counts grouped by type and day (last 30 days) from all module event_logs.
 */
router.get('/analytics/events', async (req, res) => {
  try {
    const pool = await getDb();

    const result = await pool.request().query(`
      SELECT
        CAST(created_at AS DATE) AS event_date,
        event_type,
        COUNT(*) AS event_count
      FROM (
        SELECT created_at, event_type FROM aquadocs.event_log
        WHERE created_at >= DATEADD(DAY, -30, GETDATE())
        UNION ALL
        SELECT created_at, event_type FROM aquarecords.event_log
        WHERE created_at >= DATEADD(DAY, -30, GETDATE())
        UNION ALL
        SELECT created_at, event_type FROM aquaanalytics.event_log
        WHERE created_at >= DATEADD(DAY, -30, GETDATE())
      ) combined
      GROUP BY CAST(created_at AS DATE), event_type
      ORDER BY event_date DESC, event_count DESC
    `);

    eventBus.publish(EVENT_TYPES.EVENTS_ANALYZED, { rowCount: result.recordset.length }, req.user?.preferred_username).catch(() => {});
    res.json({ events: result.recordset, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[analytics/events]', err.message);
    res.json({ events: getMockEventData(), generatedAt: new Date().toISOString(), _stub: true });
  }
});

/**
 * GET /api/internal/analytics/modules
 * Per-module stats: AquaDocs query count, AquaRecords request count, etc.
 */
router.get('/analytics/modules', async (req, res) => {
  try {
    const pool = await getDb();

    const [docsRes, recordsRes] = await Promise.all([
      pool.request().query(`
        SELECT
          SUM(CASE WHEN event_type = 'aquadocs.document.search' THEN 1 ELSE 0 END) AS doc_searches,
          SUM(CASE WHEN event_type = 'aquadocs.chat.query'      THEN 1 ELSE 0 END) AS chat_queries,
          COUNT(*) AS total_events,
          COUNT(DISTINCT user_id) AS unique_users
        FROM aquadocs.event_log
        WHERE created_at >= DATEADD(DAY, -7, GETDATE())
      `),
      pool.request().query(`
        SELECT COUNT(*) AS total_events, COUNT(DISTINCT user_id) AS unique_users
        FROM aquarecords.event_log
        WHERE created_at >= DATEADD(DAY, -7, GETDATE())
      `),
    ]);

    eventBus.publish(EVENT_TYPES.MODULES_ANALYZED, {}, req.user?.preferred_username).catch(() => {});

    res.json({
      period: '7d',
      modules: {
        aquadocs: {
          docSearches:  docsRes.recordset[0].doc_searches,
          chatQueries:  docsRes.recordset[0].chat_queries,
          totalEvents:  docsRes.recordset[0].total_events,
          uniqueUsers:  docsRes.recordset[0].unique_users,
        },
        aquarecords: {
          totalEvents:  recordsRes.recordset[0].total_events,
          uniqueUsers:  recordsRes.recordset[0].unique_users,
        },
        aquaai:       { totalEvents: 0, note: 'Schema not yet provisioned' },
        aquahawk:     { totalEvents: 0, note: 'Schema not yet provisioned' },
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[analytics/modules]', err.message);
    res.json(getMockModuleStats());
  }
});

/**
 * GET /api/internal/analytics/users
 * User activity: distinct users, queries per user (last 7d).
 */
router.get('/analytics/users', async (req, res) => {
  try {
    const pool = await getDb();

    const result = await pool.request().query(`
      SELECT
        user_id,
        COUNT(*) AS total_events,
        MIN(created_at) AS first_seen,
        MAX(created_at) AS last_seen
      FROM (
        SELECT user_id, created_at FROM aquadocs.event_log
        WHERE created_at >= DATEADD(DAY, -7, GETDATE()) AND user_id IS NOT NULL
        UNION ALL
        SELECT user_id, created_at FROM aquarecords.event_log
        WHERE created_at >= DATEADD(DAY, -7, GETDATE()) AND user_id IS NOT NULL
      ) combined
      GROUP BY user_id
      ORDER BY total_events DESC
    `);

    eventBus.publish(EVENT_TYPES.USERS_ANALYZED, { userCount: result.recordset.length }, req.user?.preferred_username).catch(() => {});
    res.json({ users: result.recordset, period: '7d', generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[analytics/users]', err.message);
    res.json({ users: getMockUsers(), period: '7d', generatedAt: new Date().toISOString(), _stub: true });
  }
});

// ---- Mock data helpers ----
function getMockOverview() {
  return {
    totalEventsToday: 42,
    activeUsersToday: 7,
    aquaDocsSearchesToday: 18,
    aquaRecordsRequestsToday: 3,
    generatedAt: new Date().toISOString(),
    _stub: true,
    _message: 'DB not reachable — showing mock data',
  };
}

function getMockEventData() {
  const types = ['api.request', 'aquadocs.document.search', 'aquadocs.chat.query', 'aquarecords.request.submitted'];
  const rows = [];
  for (let d = 0; d < 14; d++) {
    const date = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    types.forEach((t) => {
      rows.push({ event_date: date, event_type: t, event_count: Math.floor(Math.random() * 30) });
    });
  }
  return rows;
}

function getMockModuleStats() {
  return {
    period: '7d',
    modules: {
      aquadocs:     { docSearches: 87, chatQueries: 34, totalEvents: 312, uniqueUsers: 12 },
      aquarecords:  { totalEvents: 45, uniqueUsers: 8 },
      aquaai:       { totalEvents: 0, note: 'Schema not yet provisioned' },
      aquahawk:     { totalEvents: 0, note: 'Schema not yet provisioned' },
    },
    generatedAt: new Date().toISOString(),
    _stub: true,
  };
}

function getMockUsers() {
  return [
    { user_id: 'jsmith@saws.org',    total_events: 47, first_seen: '2026-04-13T08:12:00Z', last_seen: '2026-04-19T14:30:00Z' },
    { user_id: 'mjones@saws.org',    total_events: 38, first_seen: '2026-04-14T09:00:00Z', last_seen: '2026-04-19T13:15:00Z' },
    { user_id: 'bwilliams@saws.org', total_events: 24, first_seen: '2026-04-15T10:30:00Z', last_seen: '2026-04-18T16:45:00Z' },
    { user_id: 'demo@saws.org',      total_events: 18, first_seen: '2026-04-12T14:00:00Z', last_seen: '2026-04-19T11:00:00Z' },
    { user_id: 'lgarcia@saws.org',   total_events: 12, first_seen: '2026-04-16T08:30:00Z', last_seen: '2026-04-19T09:45:00Z' },
  ];
}

module.exports = router;
