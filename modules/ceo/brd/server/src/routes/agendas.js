const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { getDb, sql } = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Validation helper
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

// GET /api/agendas - List agendas with optional type filter
// BRD 7.1: Committee agendas (Audit, Compensation)
// BRD 7.2: Board agendas with archive
router.get('/',
  [
    query('type').optional().isIn(['Committee', 'Board']).withMessage('type must be Committee or Board'),
    query('committeeType').optional().isIn(['Audit', 'Compensation']).withMessage('committeeType must be Audit or Compensation'),
    query('status').optional().isIn(['Draft', 'Published', 'Archived']).withMessage('Invalid status')
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;
    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('AgendaType', sql.VarChar(20), req.query.type || null)
        .input('CommitteeType', sql.VarChar(20), req.query.committeeType || null)
        .input('Status', sql.VarChar(20), req.query.status || null)
        .execute('ceo.usp_GetAgendas');
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching agendas:', err);
      res.status(500).json({ error: 'Failed to fetch agendas' });
    }
  }
);

// GET /api/agendas/:id - Get agenda detail with documents
router.get('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid agenda ID')],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;
    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('AgendaID', sql.Int, req.params.id)
        .execute('ceo.usp_GetAgendaById');

      if (!result.recordsets[0] || result.recordsets[0].length === 0) {
        return res.status(404).json({ error: 'Agenda not found' });
      }

      const agenda = result.recordsets[0][0];
      agenda.documents = result.recordsets[1] || [];
      res.json(agenda);
    } catch (err) {
      console.error('Error fetching agenda:', err);
      res.status(500).json({ error: 'Failed to fetch agenda' });
    }
  }
);

// POST /api/agendas - Create agenda (auth required)
router.post('/',
  authenticate,
  [
    body('agendaType').isIn(['Committee', 'Board']).withMessage('agendaType must be Committee or Board'),
    body('committeeType').optional({ nullable: true }).isIn(['Audit', 'Compensation']).withMessage('committeeType must be Audit or Compensation'),
    body('meetingDate').isISO8601().withMessage('Valid meetingDate required'),
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required (max 255 chars)'),
    body('description').optional().trim(),
    body('accessibilityNotes').optional().trim(),
    body('location').optional().trim().isLength({ max: 255 }),
    body('status').optional().isIn(['Draft', 'Published', 'Archived'])
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;

    // BRD 7.1: Committee agendas require committeeType
    if (req.body.agendaType === 'Committee' && !req.body.committeeType) {
      return res.status(400).json({ error: 'committeeType is required for Committee agendas' });
    }

    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('AgendaType', sql.VarChar(20), req.body.agendaType)
        .input('CommitteeType', sql.VarChar(20), req.body.agendaType === 'Committee' ? req.body.committeeType : null)
        .input('MeetingDate', sql.DateTime, req.body.meetingDate)
        .input('Title', sql.NVarChar(255), req.body.title)
        .input('Description', sql.NVarChar(sql.MAX), req.body.description || null)
        .input('AccessibilityNotes', sql.NVarChar(sql.MAX), req.body.accessibilityNotes || null)
        .input('Location', sql.NVarChar(255), req.body.location || null)
        .input('Status', sql.VarChar(20), req.body.status || 'Draft')
        .input('CreatedByEmployeeID', sql.Int, req.user.employeeId || null)
        .execute('ceo.usp_InsertAgenda');

      res.status(201).json({ agendaId: result.recordset[0].AgendaID, message: 'Agenda created' });
    } catch (err) {
      console.error('Error creating agenda:', err);
      res.status(500).json({ error: 'Failed to create agenda' });
    }
  }
);

// PUT /api/agendas/:id - Update agenda (auth required)
router.put('/:id',
  authenticate,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid agenda ID'),
    body('agendaType').isIn(['Committee', 'Board']).withMessage('agendaType must be Committee or Board'),
    body('committeeType').optional({ nullable: true }).isIn(['Audit', 'Compensation']),
    body('meetingDate').isISO8601().withMessage('Valid meetingDate required'),
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
    body('description').optional().trim(),
    body('accessibilityNotes').optional().trim(),
    body('location').optional().trim().isLength({ max: 255 }),
    body('status').optional().isIn(['Draft', 'Published', 'Archived'])
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;

    if (req.body.agendaType === 'Committee' && !req.body.committeeType) {
      return res.status(400).json({ error: 'committeeType is required for Committee agendas' });
    }

    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('AgendaID', sql.Int, req.params.id)
        .input('AgendaType', sql.VarChar(20), req.body.agendaType)
        .input('CommitteeType', sql.VarChar(20), req.body.agendaType === 'Committee' ? req.body.committeeType : null)
        .input('MeetingDate', sql.DateTime, req.body.meetingDate)
        .input('Title', sql.NVarChar(255), req.body.title)
        .input('Description', sql.NVarChar(sql.MAX), req.body.description || null)
        .input('AccessibilityNotes', sql.NVarChar(sql.MAX), req.body.accessibilityNotes || null)
        .input('Location', sql.NVarChar(255), req.body.location || null)
        .input('Status', sql.VarChar(20), req.body.status || 'Draft')
        .execute('ceo.usp_UpdateAgenda');

      if (result.recordset[0].RowsAffected === 0) {
        return res.status(404).json({ error: 'Agenda not found' });
      }
      res.json({ message: 'Agenda updated' });
    } catch (err) {
      console.error('Error updating agenda:', err);
      res.status(500).json({ error: 'Failed to update agenda' });
    }
  }
);

// DELETE /api/agendas/:id - Delete agenda (auth required)
router.delete('/:id',
  authenticate,
  [param('id').isInt({ min: 1 }).withMessage('Invalid agenda ID')],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;
    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('AgendaID', sql.Int, req.params.id)
        .execute('ceo.usp_DeleteAgenda');

      if (result.recordset[0].RowsAffected === 0) {
        return res.status(404).json({ error: 'Agenda not found' });
      }
      res.json({ message: 'Agenda deleted' });
    } catch (err) {
      console.error('Error deleting agenda:', err);
      res.status(500).json({ error: 'Failed to delete agenda' });
    }
  }
);

// POST /api/agendas/:id/documents - Add document to agenda (auth required)
// BRD 7.1: Manage committee documents
router.post('/:id/documents',
  authenticate,
  [
    param('id').isInt({ min: 1 }).withMessage('Invalid agenda ID'),
    body('fileName').trim().isLength({ min: 1, max: 255 }).withMessage('fileName is required'),
    body('fileType').optional().trim().isLength({ max: 50 }),
    body('description').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    if (handleValidationErrors(req, res)) return;
    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('AgendaID', sql.Int, req.params.id)
        .input('FileName', sql.NVarChar(255), req.body.fileName)
        .input('FileType', sql.VarChar(50), req.body.fileType || null)
        .input('Description', sql.NVarChar(500), req.body.description || null)
        .execute('ceo.usp_InsertAgendaDocument');

      res.status(201).json({ documentId: result.recordset[0].DocumentID, message: 'Document added' });
    } catch (err) {
      console.error('Error adding document:', err);
      res.status(500).json({ error: 'Failed to add document' });
    }
  }
);

module.exports = router;
