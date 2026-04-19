const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
// NOTE: Group-based authorization (SAWS-Records-Admin) is scaffolded in
// ../middleware/authorize.js and will be wired here post-PoC once AD groups
// are provisioned. During PoC all authenticated AD users have access.
const { getDb, sql } = require('../config/database');

// All admin routes require Azure AD authentication
router.use(authenticate);

/**
 * GET /api/internal/admin/reports
 * SLA stats: avg response days, on-time %, requests by month, top exemptions.
 */
router.get('/reports', async (req, res) => {
  try {
    const pool = await getDb();

    // SLA summary
    const slaResult = await pool.request().query(`
      SELECT
        AVG(CAST(DATEDIFF(day, submitted_at, response_date) AS FLOAT)) AS avg_response_days,
        COUNT(CASE WHEN response_date <= due_date THEN 1 END) * 100.0 /
          NULLIF(COUNT(response_date), 0) AS on_time_pct,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) AS total_completed,
        COUNT(CASE WHEN status IN ('denied','partial') THEN 1 END) AS total_denied
      FROM records.requests
    `);

    // Requests by month (last 12 months)
    const byMonthResult = await pool.request().query(`
      SELECT
        FORMAT(submitted_at, 'yyyy-MM') AS month,
        COUNT(*) AS count
      FROM records.requests
      WHERE submitted_at >= DATEADD(month, -12, GETDATE())
      GROUP BY FORMAT(submitted_at, 'yyyy-MM')
      ORDER BY month ASC
    `);

    // Top exemptions used
    const exemptionsResult = await pool.request().query(`
      SELECT TOP 10
        e.code,
        e.statutory_basis,
        COUNT(r.id) AS count
      FROM records.exemptions e
      JOIN records.requests r
        ON r.exemptions_applied LIKE '%' + e.code + '%'
      WHERE e.is_active = 1
      GROUP BY e.code, e.statutory_basis
      ORDER BY count DESC
    `);

    res.json({
      ...slaResult.recordset[0],
      by_month: byMonthResult.recordset,
      top_exemptions: exemptionsResult.recordset,
    });
  } catch (err) {
    console.error('[admin/reports]', err.message);
    // Stub data when DB not yet provisioned (PoC mode)
    res.json({
      avg_response_days: 7.4,
      on_time_pct: 91.2,
      total_completed: 284,
      total_denied: 23,
      by_month: [
        { month: '2025-11', count: 18 },
        { month: '2025-12', count: 22 },
        { month: '2026-01', count: 31 },
        { month: '2026-02', count: 27 },
        { month: '2026-03', count: 34 },
        { month: '2026-04', count: 14 },
      ],
      top_exemptions: [
        { code: '552.110', statutory_basis: 'Tex. Gov\'t Code §552.110', count: 41 },
        { code: '552.101', statutory_basis: 'Tex. Gov\'t Code §552.101', count: 28 },
        { code: '552.107', statutory_basis: 'Tex. Gov\'t Code §552.107', count: 16 },
        { code: '552.104', statutory_basis: 'Tex. Gov\'t Code §552.104', count: 9 },
      ],
      _stub: true,
      _message: 'DB not reachable — showing mock SLA data',
    });
  }
});

/**
 * GET /api/internal/admin/exemptions
 * List all exemption categories.
 */
router.get('/exemptions', async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(
      `SELECT id, code, statutory_basis, description, is_active, created_at
       FROM records.exemptions
       ORDER BY code ASC`
    );
    res.json({ exemptions: result.recordset });
  } catch (err) {
    console.error('[admin/exemptions GET]', err.message);
    // Stub data when DB not yet provisioned (PoC mode)
    res.json({
      exemptions: [
        { id: 1, code: '552.101', statutory_basis: 'Tex. Gov\'t Code §552.101', description: 'Exception for information that is confidential by law, either constitutional, statutory, or by judicial decision.', is_active: true, created_at: '2026-01-15T00:00:00.000Z' },
        { id: 2, code: '552.104', statutory_basis: 'Tex. Gov\'t Code §552.104', description: 'Exception for information related to litigation involving a governmental body.', is_active: true, created_at: '2026-01-15T00:00:00.000Z' },
        { id: 3, code: '552.107', statutory_basis: 'Tex. Gov\'t Code §552.107', description: 'Exception for certain legal matters, including opinions of attorney general or governmental attorneys.', is_active: true, created_at: '2026-01-15T00:00:00.000Z' },
        { id: 4, code: '552.108', statutory_basis: 'Tex. Gov\'t Code §552.108', description: 'Exception for certain law enforcement, corrections, and prosecutorial information.', is_active: true, created_at: '2026-01-15T00:00:00.000Z' },
        { id: 5, code: '552.110', statutory_basis: 'Tex. Gov\'t Code §552.110', description: 'Exception for trade secrets and commercial or financial information from a third party where disclosure would cause substantial competitive harm.', is_active: true, created_at: '2026-01-15T00:00:00.000Z' },
        { id: 6, code: '552.117', statutory_basis: 'Tex. Gov\'t Code §552.117', description: 'Exception for home address, telephone numbers, social security numbers, and family members of certain public servants.', is_active: true, created_at: '2026-01-15T00:00:00.000Z' },
      ],
      _stub: true,
      _message: 'DB not reachable — showing mock exemptions',
    });
  }
});

/**
 * POST /api/internal/admin/exemptions
 * Create or update an exemption (upsert by code).
 */
router.post(
  '/exemptions',
  [
    body('code').notEmpty().trim().withMessage('Code is required'),
    body('statutory_basis').notEmpty().trim().withMessage('Statutory basis is required'),
    body('description').notEmpty().trim().withMessage('Description is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { code, statutory_basis, description, is_active = true } = req.body;

    try {
      const pool = await getDb();
      await pool
        .request()
        .input('code', sql.VarChar(20), code)
        .input('statutory_basis', sql.NVarChar(200), statutory_basis)
        .input('description', sql.NVarChar(1000), description)
        .input('is_active', sql.Bit, is_active ? 1 : 0)
        .query(`
          MERGE records.exemptions AS target
          USING (VALUES (@code)) AS source(code) ON target.code = source.code
          WHEN MATCHED THEN
            UPDATE SET
              statutory_basis = @statutory_basis,
              description = @description,
              is_active = @is_active
          WHEN NOT MATCHED THEN
            INSERT (code, statutory_basis, description, is_active)
            VALUES (@code, @statutory_basis, @description, @is_active);
        `);

      res.json({ success: true, code });
    } catch (err) {
      console.error('[admin/exemptions POST]', err.message);
      res.status(500).json({ error: 'Failed to save exemption' });
    }
  }
);

/**
 * DELETE /api/internal/admin/exemptions/:id
 * Soft-delete by setting is_active = 0.
 */
router.delete('/exemptions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const pool = await getDb();
    await pool
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE records.exemptions SET is_active = 0 WHERE id = @id');

    res.json({ success: true });
  } catch (err) {
    console.error('[admin/exemptions DELETE]', err.message);
    res.status(500).json({ error: 'Failed to delete exemption' });
  }
});

module.exports = router;
