const router = require('express').Router();
const { query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
// NOTE: Group-based authorization (SAWS-AquaDocs-Admin) is scaffolded in
// ../middleware/authorize.js and will be wired here post-PoC once AD groups
// are provisioned. During PoC all authenticated AD users have access.
const { getDb, sql } = require('../config/database');
const azureSearch = require('../services/azureSearchService');

// All admin routes require Azure AD authentication
router.use(authenticate);

/**
 * GET /api/internal/admin/pipeline
 * Latest 10 pipeline runs from aquadocs.pipeline_run_log.
 */
router.get('/pipeline', async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(
      `SELECT TOP 10
         id, run_id, status, docs_scanned, docs_indexed,
         embed_rows, index_rows, errors,
         started_at, completed_at
       FROM aquadocs.pipeline_run_log
       ORDER BY started_at DESC`
    );
    res.json({ runs: result.recordset });
  } catch (err) {
    console.error('[admin/pipeline]', err.message);
    res.status(500).json({ error: 'Failed to load pipeline runs' });
  }
});

/**
 * GET /api/internal/admin/documents
 * Paginated document list from aquadocs.documents (or the pipeline's documents table).
 * Supports filters: doc_type, department, page, limit.
 */
router.get(
  '/documents',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const page = req.query.page || 1;
    const limit = req.query.limit || 25;
    const offset = (page - 1) * limit;

    try {
      const pool = await getDb();
      const request = pool.request();
      const conditions = [];

      if (req.query.doc_type) {
        request.input('docType', sql.VarChar(50), req.query.doc_type);
        conditions.push('doc_type = @docType');
      }
      if (req.query.department) {
        request.input('department', sql.VarChar(100), req.query.department);
        conditions.push('department = @department');
      }

      const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const countResult = await request.query(
        `SELECT COUNT(*) AS total FROM aquadocs.documents ${where}`
      );
      const total = countResult.recordset[0].total;

      request.input('offset', sql.Int, offset);
      request.input('limit', sql.Int, limit);

      const dataResult = await request.query(
        `SELECT id, title, source_file, doc_type, department,
                embedding_status, chunk_count, indexed_at, created_at
         FROM aquadocs.documents
         ${where}
         ORDER BY created_at DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
      );

      res.json({ documents: dataResult.recordset, total, page, limit });
    } catch (err) {
      console.error('[admin/documents]', err.message);
      res.status(500).json({ error: 'Failed to load documents' });
    }
  }
);

/**
 * GET /api/internal/admin/index-health
 * Document counts from Azure AI Search index.
 */
router.get('/index-health', async (req, res) => {
  try {
    const health = await azureSearch.getIndexHealth();
    res.json(health);
  } catch (err) {
    console.error('[admin/index-health]', err.message);
    res.status(500).json({ error: 'Failed to get index health' });
  }
});

module.exports = router;
