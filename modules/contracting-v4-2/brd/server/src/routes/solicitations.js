const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { sql, getDb } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// --- Validation helpers ---
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

const solicitationValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('solicitationType').trim().notEmpty().withMessage('Solicitation type is required'),
  body('deadline').optional({ nullable: true }).isISO8601().withMessage('Valid deadline date is required'),
  body('status')
    .optional()
    .isIn(['Open', 'Closed', 'Awarded'])
    .withMessage('Status must be Open, Closed, or Awarded'),
  body('awardedVendorId').optional({ nullable: true }).isInt().withMessage('Awarded vendor ID must be an integer'),
  body('awardDate').optional({ nullable: true }).isISO8601().withMessage('Valid award date is required'),
];

const documentValidation = [
  body('fileName').trim().notEmpty().withMessage('File name is required'),
  body('fileType').trim().notEmpty().withMessage('File type is required'),
  body('description').optional().trim(),
];

const notifyValidation = [
  body('message').trim().notEmpty().withMessage('Notification message is required'),
  body('recipientCount').isInt({ min: 1 }).withMessage('Recipient count must be at least 1'),
];

// GET /api/solicitations - List solicitations with optional filters
router.get('/', authenticate, [
  query('status').optional().isIn(['Open', 'Closed', 'Awarded']).withMessage('Invalid status filter'),
  query('type').optional().trim(),
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const pool = await getDb();
    const request = pool.request();

    let whereClause = '';
    const conditions = [];

    if (req.query.status) {
      conditions.push('s.Status = @status');
      request.input('status', sql.NVarChar(50), req.query.status);
    }

    if (req.query.type) {
      conditions.push('s.SolicitationType = @type');
      request.input('type', sql.NVarChar(100), req.query.type);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const result = await request.query(`
      SELECT s.SolicitationID, s.Title, s.SolicitationType, s.PostedDate,
             s.Deadline, s.Status, s.AwardedVendorID, s.AwardDate,
             s.CreatedByEmployeeID, s.CreatedDate, s.ModifiedDate,
             (SELECT COUNT(*) FROM contracting.SolicitationDocuments d
              WHERE d.SolicitationID = s.SolicitationID) AS DocumentCount
      FROM contracting.Solicitations s
      ${whereClause}
      ORDER BY s.PostedDate DESC, s.CreatedDate DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching solicitations:', err);
    res.status(500).json({ error: 'Failed to fetch solicitations' });
  }
});

// GET /api/solicitations/:id - Get solicitation detail with documents
router.get('/:id', authenticate, [
  param('id').isInt().withMessage('Valid solicitation ID is required'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const pool = await getDb();

    // Fetch solicitation
    const solResult = await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .query(`
        SELECT SolicitationID, Title, Description, SolicitationType,
               PostedDate, Deadline, Status, AwardedVendorID, AwardDate,
               CreatedByEmployeeID, CreatedDate, ModifiedDate
        FROM contracting.Solicitations
        WHERE SolicitationID = @solicitationId
      `);

    if (solResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Solicitation not found' });
    }

    // Fetch associated documents
    const docsResult = await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .query(`
        SELECT DocumentID, FileName, FileType, Description, UploadDate
        FROM contracting.SolicitationDocuments
        WHERE SolicitationID = @solicitationId
        ORDER BY UploadDate DESC
      `);

    // Fetch notification history
    const notifResult = await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .query(`
        SELECT NotificationID, SentDate, RecipientCount, Message
        FROM contracting.SolicitationNotifications
        WHERE SolicitationID = @solicitationId
        ORDER BY SentDate DESC
      `);

    const solicitation = solResult.recordset[0];
    solicitation.documents = docsResult.recordset;
    solicitation.notifications = notifResult.recordset;

    res.json(solicitation);
  } catch (err) {
    console.error('Error fetching solicitation detail:', err);
    res.status(500).json({ error: 'Failed to fetch solicitation detail' });
  }
});

// POST /api/solicitations - Create solicitation (auth required)
router.post('/', authenticate, solicitationValidation, async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { title, description, solicitationType, deadline, status } = req.body;
    const pool = await getDb();

    const result = await pool.request()
      .input('title', sql.NVarChar(300), title)
      .input('description', sql.NVarChar(sql.MAX), description || null)
      .input('solicitationType', sql.NVarChar(100), solicitationType)
      .input('postedDate', sql.DateTime, new Date())
      .input('deadline', sql.DateTime, deadline || null)
      .input('status', sql.NVarChar(50), status || 'Open')
      .input('createdBy', sql.Int, req.user.employeeId)
      .query(`
        INSERT INTO contracting.Solicitations
          (Title, Description, SolicitationType, PostedDate, Deadline, Status,
           CreatedByEmployeeID, CreatedDate, ModifiedDate)
        VALUES
          (@title, @description, @solicitationType, @postedDate, @deadline, @status,
           @createdBy, GETDATE(), GETDATE());
        SELECT SCOPE_IDENTITY() AS SolicitationID;
      `);

    res.status(201).json({
      message: 'Solicitation created successfully',
      solicitationId: result.recordset[0].SolicitationID,
    });
  } catch (err) {
    console.error('Error creating solicitation:', err);
    res.status(500).json({ error: 'Failed to create solicitation' });
  }
});

// PUT /api/solicitations/:id - Update solicitation
router.put('/:id', authenticate, [
  param('id').isInt().withMessage('Valid solicitation ID is required'),
  ...solicitationValidation,
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { title, description, solicitationType, deadline, status, awardedVendorId, awardDate } = req.body;
    const pool = await getDb();

    const result = await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .input('title', sql.NVarChar(300), title)
      .input('description', sql.NVarChar(sql.MAX), description || null)
      .input('solicitationType', sql.NVarChar(100), solicitationType)
      .input('deadline', sql.DateTime, deadline || null)
      .input('status', sql.NVarChar(50), status || 'Open')
      .input('awardedVendorId', sql.Int, awardedVendorId || null)
      .input('awardDate', sql.DateTime, awardDate || null)
      .query(`
        UPDATE contracting.Solicitations
        SET Title = @title,
            Description = @description,
            SolicitationType = @solicitationType,
            Deadline = @deadline,
            Status = @status,
            AwardedVendorID = @awardedVendorId,
            AwardDate = @awardDate,
            ModifiedDate = GETDATE()
        WHERE SolicitationID = @solicitationId;
        SELECT @@ROWCOUNT AS affected;
      `);

    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ error: 'Solicitation not found' });
    }

    res.json({ message: 'Solicitation updated successfully' });
  } catch (err) {
    console.error('Error updating solicitation:', err);
    res.status(500).json({ error: 'Failed to update solicitation' });
  }
});

// DELETE /api/solicitations/:id - Remove solicitation
router.delete('/:id', authenticate, requireRole('Admin'), [
  param('id').isInt().withMessage('Valid solicitation ID is required'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const pool = await getDb();

    // Delete associated notifications first
    await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .query('DELETE FROM contracting.SolicitationNotifications WHERE SolicitationID = @solicitationId');

    // Delete associated documents
    await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .query('DELETE FROM contracting.SolicitationDocuments WHERE SolicitationID = @solicitationId');

    // Delete the solicitation
    const result = await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .query(`
        DELETE FROM contracting.Solicitations WHERE SolicitationID = @solicitationId;
        SELECT @@ROWCOUNT AS affected;
      `);

    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ error: 'Solicitation not found' });
    }

    res.json({ message: 'Solicitation deleted successfully' });
  } catch (err) {
    console.error('Error deleting solicitation:', err);
    res.status(500).json({ error: 'Failed to delete solicitation' });
  }
});

// POST /api/solicitations/:id/documents - Add document to solicitation
router.post('/:id/documents', authenticate, [
  param('id').isInt().withMessage('Valid solicitation ID is required'),
  ...documentValidation,
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { fileName, fileType, description } = req.body;
    const pool = await getDb();

    // Verify solicitation exists
    const solCheck = await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .query('SELECT SolicitationID FROM contracting.Solicitations WHERE SolicitationID = @solicitationId');

    if (solCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Solicitation not found' });
    }

    const result = await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .input('fileName', sql.NVarChar(255), fileName)
      .input('fileType', sql.NVarChar(50), fileType)
      .input('description', sql.NVarChar(500), description || null)
      .query(`
        INSERT INTO contracting.SolicitationDocuments
          (SolicitationID, FileName, FileType, Description, UploadDate)
        VALUES
          (@solicitationId, @fileName, @fileType, @description, GETDATE());
        SELECT SCOPE_IDENTITY() AS DocumentID;
      `);

    res.status(201).json({
      message: 'Document added successfully',
      documentId: result.recordset[0].DocumentID,
    });
  } catch (err) {
    console.error('Error adding document:', err);
    res.status(500).json({ error: 'Failed to add document' });
  }
});

// POST /api/solicitations/:id/notify - Send notification to subscribers
router.post('/:id/notify', authenticate, [
  param('id').isInt().withMessage('Valid solicitation ID is required'),
  ...notifyValidation,
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { message, recipientCount } = req.body;
    const pool = await getDb();

    // Verify solicitation exists
    const solCheck = await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .query('SELECT SolicitationID, Title FROM contracting.Solicitations WHERE SolicitationID = @solicitationId');

    if (solCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Solicitation not found' });
    }

    const result = await pool.request()
      .input('solicitationId', sql.Int, req.params.id)
      .input('message', sql.NVarChar(sql.MAX), message)
      .input('recipientCount', sql.Int, recipientCount)
      .query(`
        INSERT INTO contracting.SolicitationNotifications
          (SolicitationID, SentDate, RecipientCount, Message)
        VALUES
          (@solicitationId, GETDATE(), @recipientCount, @message);
        SELECT SCOPE_IDENTITY() AS NotificationID;
      `);

    // In production, this would trigger actual email delivery
    res.status(201).json({
      message: 'Notification sent successfully',
      notificationId: result.recordset[0].NotificationID,
      recipientCount,
    });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;
