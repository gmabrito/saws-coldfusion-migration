const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize, GROUPS } = require('../middleware/authorize');
const { getDb, sql } = require('../config/database');

// All admin routes require auth + admin group
router.use(authenticate);
router.use(authorize([GROUPS.ADMIN]));

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
    res.status(500).json({ error: 'Failed to load reports' });
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
    res.status(500).json({ error: 'Failed to load exemptions' });
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
