const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { sql, getPool } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation helper
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return null;
}

// GET /api/transmittals - List transmittals with pagination
// BRD 6.1: Retrieve record indexes
router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['Draft', 'Submitted', 'Reviewed', 'In Storage', 'Disposed']),
    query('departmentId').optional().isInt().toInt()
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const page = req.query.page || 1;
      const pageSize = req.query.pageSize || 20;
      const status = req.query.status || null;
      const departmentId = req.query.departmentId || null;

      const pool = await getPool();
      const result = await pool.request()
        .input('PageNumber', sql.Int, page)
        .input('PageSize', sql.Int, pageSize)
        .input('Status', sql.VarChar(20), status)
        .input('DepartmentID', sql.Int, departmentId)
        .execute('records.usp_GetTransmittals');

      const transmittals = result.recordsets[0];
      const totalCount = result.recordsets[1][0].TotalCount;

      res.json({
        data: transmittals,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      });
    } catch (err) {
      console.error('Error fetching transmittals:', err);
      res.status(500).json({ error: 'Failed to fetch transmittals.' });
    }
  }
);

// GET /api/transmittals/search - Keyword search across box indexes
// BRD 6.1: Keyword searches to identify boxes with potentially relevant records
router.get('/search',
  authenticate,
  [
    query('keyword').notEmpty().withMessage('Keyword is required').trim().escape()
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('Keyword', sql.NVarChar(100), req.query.keyword)
        .execute('records.usp_SearchBoxIndexes');

      res.json({ data: result.recordset });
    } catch (err) {
      console.error('Error searching box indexes:', err);
      res.status(500).json({ error: 'Failed to search box indexes.' });
    }
  }
);

// GET /api/transmittals/:id - Get transmittal detail with box indexes
// BRD 6.1: Retrieve record indexes
router.get('/:id',
  authenticate,
  [param('id').isInt().toInt()],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('TransmittalID', sql.Int, req.params.id)
        .execute('records.usp_GetTransmittalDetail');

      const transmittal = result.recordsets[0][0];
      if (!transmittal) {
        return res.status(404).json({ error: 'Transmittal not found.' });
      }

      const boxes = result.recordsets[1];
      res.json({ data: { ...transmittal, boxes } });
    } catch (err) {
      console.error('Error fetching transmittal detail:', err);
      res.status(500).json({ error: 'Failed to fetch transmittal detail.' });
    }
  }
);

// POST /api/transmittals - Create new transmittal with box indexes
// BRD 6.1: Submit records indexes of SAWS records which require offsite storage
router.post('/',
  authenticate,
  [
    body('departmentId').isInt().withMessage('Department ID is required'),
    body('status').optional().isIn(['Draft', 'Submitted']),
    body('notes').optional().isString().trim(),
    body('boxes').isArray({ min: 1 }).withMessage('At least one box index is required'),
    body('boxes.*.boxNumber').notEmpty().withMessage('Box number is required').trim(),
    body('boxes.*.description').notEmpty().withMessage('Description is required').trim(),
    body('boxes.*.retentionCode').notEmpty().withMessage('Retention code is required').trim(),
    body('boxes.*.retentionDate').optional({ nullable: true }).isISO8601(),
    body('boxes.*.dispositionDate').optional({ nullable: true }).isISO8601(),
    body('boxes.*.location').optional().isString().trim(),
    body('boxes.*.keywords').optional().isString().trim()
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { departmentId, status, notes, boxes } = req.body;
    let transaction;

    try {
      const pool = await getPool();
      transaction = pool.transaction();
      await transaction.begin();

      // Insert transmittal header
      const transmittalResult = await transaction.request()
        .input('DepartmentID', sql.Int, departmentId)
        .input('SubmittedByEmployeeID', sql.Int, req.user.employeeId)
        .input('Status', sql.VarChar(20), status || 'Submitted')
        .input('Notes', sql.NVarChar(1000), notes || null)
        .execute('records.usp_InsertTransmittal');

      const transmittalId = transmittalResult.recordset[0].TransmittalID;

      // Insert each box index
      for (const box of boxes) {
        await transaction.request()
          .input('TransmittalID', sql.Int, transmittalId)
          .input('BoxNumber', sql.VarChar(50), box.boxNumber)
          .input('Description', sql.NVarChar(500), box.description)
          .input('RetentionCode', sql.VarChar(20), box.retentionCode)
          .input('RetentionDate', sql.Date, box.retentionDate || null)
          .input('DispositionDate', sql.Date, box.dispositionDate || null)
          .input('Location', sql.VarChar(100), box.location || null)
          .input('Keywords', sql.NVarChar(500), box.keywords || null)
          .execute('records.usp_InsertBoxIndex');
      }

      await transaction.commit();
      res.status(201).json({
        message: 'Transmittal created successfully.',
        data: { transmittalId }
      });
    } catch (err) {
      if (transaction) {
        try { await transaction.rollback(); } catch (_) { /* ignore rollback errors */ }
      }
      console.error('Error creating transmittal:', err);
      res.status(500).json({ error: 'Failed to create transmittal.' });
    }
  }
);

// PUT /api/transmittals/:id - Update transmittal
// BRD 6.1: Edit existing transmittal records
router.put('/:id',
  authenticate,
  [
    param('id').isInt().toInt(),
    body('departmentId').isInt().withMessage('Department ID is required'),
    body('status').isIn(['Draft', 'Submitted', 'Reviewed', 'In Storage', 'Disposed']),
    body('notes').optional({ nullable: true }).isString().trim(),
    body('boxes').optional().isArray(),
    body('boxes.*.boxId').optional().isInt(),
    body('boxes.*.boxNumber').notEmpty().withMessage('Box number is required').trim(),
    body('boxes.*.description').notEmpty().withMessage('Description is required').trim(),
    body('boxes.*.retentionCode').notEmpty().withMessage('Retention code is required').trim(),
    body('boxes.*.retentionDate').optional({ nullable: true }).isISO8601(),
    body('boxes.*.dispositionDate').optional({ nullable: true }).isISO8601(),
    body('boxes.*.location').optional().isString().trim(),
    body('boxes.*.keywords').optional().isString().trim()
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    const { departmentId, status, notes, boxes } = req.body;
    const transmittalId = req.params.id;
    let transaction;

    try {
      const pool = await getPool();
      transaction = pool.transaction();
      await transaction.begin();

      // Update transmittal header
      const updateResult = await transaction.request()
        .input('TransmittalID', sql.Int, transmittalId)
        .input('DepartmentID', sql.Int, departmentId)
        .input('Status', sql.VarChar(20), status)
        .input('Notes', sql.NVarChar(1000), notes || null)
        .execute('records.usp_UpdateTransmittal');

      if (updateResult.recordset[0].RowsAffected === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Transmittal not found.' });
      }

      // If boxes provided, replace all box indexes
      if (boxes && boxes.length > 0) {
        // Delete existing boxes
        await transaction.request()
          .input('TransmittalID', sql.Int, transmittalId)
          .query('DELETE FROM records.BoxIndexes WHERE TransmittalID = @TransmittalID');

        // Insert updated boxes
        for (const box of boxes) {
          await transaction.request()
            .input('TransmittalID', sql.Int, transmittalId)
            .input('BoxNumber', sql.VarChar(50), box.boxNumber)
            .input('Description', sql.NVarChar(500), box.description)
            .input('RetentionCode', sql.VarChar(20), box.retentionCode)
            .input('RetentionDate', sql.Date, box.retentionDate || null)
            .input('DispositionDate', sql.Date, box.dispositionDate || null)
            .input('Location', sql.VarChar(100), box.location || null)
            .input('Keywords', sql.NVarChar(500), box.keywords || null)
            .execute('records.usp_InsertBoxIndex');
        }
      }

      await transaction.commit();
      res.json({ message: 'Transmittal updated successfully.' });
    } catch (err) {
      if (transaction) {
        try { await transaction.rollback(); } catch (_) { /* ignore */ }
      }
      console.error('Error updating transmittal:', err);
      res.status(500).json({ error: 'Failed to update transmittal.' });
    }
  }
);

// DELETE /api/transmittals/:id - Delete transmittal
router.delete('/:id',
  authenticate,
  requireRole('admin', 'records'),
  [param('id').isInt().toInt()],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const pool = await getPool();
      const result = await pool.request()
        .input('TransmittalID', sql.Int, req.params.id)
        .execute('records.usp_DeleteTransmittal');

      if (result.recordset[0].RowsAffected === 0) {
        return res.status(404).json({ error: 'Transmittal not found.' });
      }

      res.json({ message: 'Transmittal deleted successfully.' });
    } catch (err) {
      console.error('Error deleting transmittal:', err);
      res.status(500).json({ error: 'Failed to delete transmittal.' });
    }
  }
);

// GET /api/retention-codes - List available retention codes
router.get('/retention-codes',
  authenticate,
  async (req, res) => {
    // Note: This route must be registered before /:id to avoid conflicts
    try {
      const pool = await getPool();
      const result = await pool.request()
        .execute('records.usp_GetRetentionCodes');

      res.json({ data: result.recordset });
    } catch (err) {
      console.error('Error fetching retention codes:', err);
      res.status(500).json({ error: 'Failed to fetch retention codes.' });
    }
  }
);

module.exports = router;
