const express = require('express');
const { body, param, validationResult } = require('express-validator');
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

const meetingValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('meetingDate').isISO8601().withMessage('Valid meeting date is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('status')
    .optional()
    .isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled'])
    .withMessage('Invalid status'),
];

const documentValidation = [
  body('fileName').trim().notEmpty().withMessage('File name is required'),
  body('fileType').trim().notEmpty().withMessage('File type is required'),
  body('description').optional().trim(),
];

// BRD 7.1 - GET /api/meetings - List all CIAC meetings
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(`
      SELECT MeetingID, MeetingDate, Title, Location, Status,
             CreatedByEmployeeID, CreatedDate, ModifiedDate
      FROM development.Meetings
      ORDER BY MeetingDate DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching meetings:', err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// BRD 7.1 - GET /api/meetings/:id - Get meeting detail with documents and minutes
router.get('/:id', authenticate, [
  param('id').isInt().withMessage('Valid meeting ID is required'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const pool = await getDb();

    // Fetch meeting
    const meetingResult = await pool.request()
      .input('meetingId', sql.Int, req.params.id)
      .query(`
        SELECT MeetingID, MeetingDate, Title, Location, Status, Minutes,
               CreatedByEmployeeID, CreatedDate, ModifiedDate
        FROM development.Meetings
        WHERE MeetingID = @meetingId
      `);

    if (meetingResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Fetch associated documents
    const docsResult = await pool.request()
      .input('meetingId', sql.Int, req.params.id)
      .query(`
        SELECT DocumentID, FileName, FileType, Description,
               UploadedByEmployeeID, UploadDate
        FROM development.MeetingDocuments
        WHERE MeetingID = @meetingId
        ORDER BY UploadDate DESC
      `);

    const meeting = meetingResult.recordset[0];
    meeting.documents = docsResult.recordset;

    res.json(meeting);
  } catch (err) {
    console.error('Error fetching meeting detail:', err);
    res.status(500).json({ error: 'Failed to fetch meeting detail' });
  }
});

// BRD 7.1 - POST /api/meetings - Create new meeting
router.post('/', authenticate, meetingValidation, async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { title, meetingDate, location, status } = req.body;
    const pool = await getDb();

    const result = await pool.request()
      .input('title', sql.NVarChar(200), title)
      .input('meetingDate', sql.DateTime, meetingDate)
      .input('location', sql.NVarChar(200), location)
      .input('status', sql.NVarChar(50), status || 'Scheduled')
      .input('createdBy', sql.Int, req.user.employeeId)
      .query(`
        INSERT INTO development.Meetings
          (Title, MeetingDate, Location, Status, CreatedByEmployeeID, CreatedDate, ModifiedDate)
        VALUES
          (@title, @meetingDate, @location, @status, @createdBy, GETDATE(), GETDATE());
        SELECT SCOPE_IDENTITY() AS MeetingID;
      `);

    res.status(201).json({
      message: 'Meeting created successfully',
      meetingId: result.recordset[0].MeetingID,
    });
  } catch (err) {
    console.error('Error creating meeting:', err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// BRD 7.1 - PUT /api/meetings/:id - Update meeting
router.put('/:id', authenticate, [
  param('id').isInt().withMessage('Valid meeting ID is required'),
  ...meetingValidation,
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { title, meetingDate, location, status } = req.body;
    const pool = await getDb();

    const result = await pool.request()
      .input('meetingId', sql.Int, req.params.id)
      .input('title', sql.NVarChar(200), title)
      .input('meetingDate', sql.DateTime, meetingDate)
      .input('location', sql.NVarChar(200), location)
      .input('status', sql.NVarChar(50), status || 'Scheduled')
      .query(`
        UPDATE development.Meetings
        SET Title = @title,
            MeetingDate = @meetingDate,
            Location = @location,
            Status = @status,
            ModifiedDate = GETDATE()
        WHERE MeetingID = @meetingId;
        SELECT @@ROWCOUNT AS affected;
      `);

    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ message: 'Meeting updated successfully' });
  } catch (err) {
    console.error('Error updating meeting:', err);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// BRD 7.1 - DELETE /api/meetings/:id - Delete meeting
router.delete('/:id', authenticate, requireRole('Admin'), [
  param('id').isInt().withMessage('Valid meeting ID is required'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const pool = await getDb();

    // Delete associated documents first
    await pool.request()
      .input('meetingId', sql.Int, req.params.id)
      .query('DELETE FROM development.MeetingDocuments WHERE MeetingID = @meetingId');

    const result = await pool.request()
      .input('meetingId', sql.Int, req.params.id)
      .query(`
        DELETE FROM development.Meetings WHERE MeetingID = @meetingId;
        SELECT @@ROWCOUNT AS affected;
      `);

    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ message: 'Meeting deleted successfully' });
  } catch (err) {
    console.error('Error deleting meeting:', err);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// BRD 7.1 - POST /api/meetings/:id/documents - Upload document metadata
router.post('/:id/documents', authenticate, [
  param('id').isInt().withMessage('Valid meeting ID is required'),
  ...documentValidation,
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { fileName, fileType, description } = req.body;
    const pool = await getDb();

    // Verify meeting exists
    const meetingCheck = await pool.request()
      .input('meetingId', sql.Int, req.params.id)
      .query('SELECT MeetingID FROM development.Meetings WHERE MeetingID = @meetingId');

    if (meetingCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const result = await pool.request()
      .input('meetingId', sql.Int, req.params.id)
      .input('fileName', sql.NVarChar(255), fileName)
      .input('fileType', sql.NVarChar(50), fileType)
      .input('description', sql.NVarChar(500), description || null)
      .input('uploadedBy', sql.Int, req.user.employeeId)
      .query(`
        INSERT INTO development.MeetingDocuments
          (MeetingID, FileName, FileType, Description, UploadedByEmployeeID, UploadDate)
        VALUES
          (@meetingId, @fileName, @fileType, @description, @uploadedBy, GETDATE());
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

// BRD 7.1 - PUT /api/meetings/:id/minutes - Update meeting minutes
router.put('/:id/minutes', authenticate, [
  param('id').isInt().withMessage('Valid meeting ID is required'),
  body('minutes').trim().notEmpty().withMessage('Minutes content is required'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const { minutes } = req.body;
    const pool = await getDb();

    const result = await pool.request()
      .input('meetingId', sql.Int, req.params.id)
      .input('minutes', sql.NVarChar(sql.MAX), minutes)
      .query(`
        UPDATE development.Meetings
        SET Minutes = @minutes,
            ModifiedDate = GETDATE()
        WHERE MeetingID = @meetingId;
        SELECT @@ROWCOUNT AS affected;
      `);

    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ message: 'Minutes updated successfully' });
  } catch (err) {
    console.error('Error updating minutes:', err);
    res.status(500).json({ error: 'Failed to update minutes' });
  }
});

module.exports = router;
