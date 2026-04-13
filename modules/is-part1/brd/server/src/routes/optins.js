const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { sql, getPool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// BRD 7.1 - Notification types for emergency SMS opt-in
const NOTIFICATION_TYPES = [
  { id: 1, name: 'Inclement/Emergency Weather', description: 'Severe weather alerts and emergency weather notifications' },
  { id: 2, name: 'Fire Alarm', description: 'Fire alarm notifications and evacuation alerts' },
  { id: 3, name: 'Hazardous Chemical Incident', description: 'Hazardous chemical spill or incident notifications' },
  { id: 4, name: 'Emergency Lockdown', description: 'Emergency lockdown notifications and instructions' },
  { id: 5, name: 'Other Emergencies', description: 'Other emergency notifications not covered above' }
];

// GET /api/notification-types - List notification types
// BRD 7.1: Notification types for opt-in preferences
router.get('/notification-types', (req, res) => {
  res.json(NOTIFICATION_TYPES);
});

// GET /api/optins - List all opt-ins (admin only)
// BRD 7.3: Report requirements - admin view of all opt-ins
router.get('/optins', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const { search, notificationType, isActive } = req.query;

    let query = `
      SELECT o.OptInID, o.EmployeeID, o.PhoneNumber, o.ConsentDate, o.IsActive, o.CreatedDate,
             e.FirstName, e.LastName, e.Email, e.Department
      FROM is_sms.OptIns o
      LEFT JOIN dbo.Employees e ON o.EmployeeID = e.EmployeeID
      WHERE 1=1
    `;
    const request = pool.request();

    if (search) {
      query += ` AND (e.FirstName LIKE @search OR e.LastName LIKE @search OR o.PhoneNumber LIKE @search)`;
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    if (isActive !== undefined) {
      query += ` AND o.IsActive = @isActive`;
      request.input('isActive', sql.Bit, isActive === 'true' ? 1 : 0);
    }

    query += ` ORDER BY o.CreatedDate DESC`;

    const result = await request.query(query);

    // Fetch preferences for each opt-in
    const optins = [];
    for (const row of result.recordset) {
      const prefs = await pool.request()
        .input('optInId', sql.Int, row.OptInID)
        .query('SELECT PreferenceID, NotificationType, IsEnabled FROM is_sms.OptInPreferences WHERE OptInID = @optInId');

      optins.push({
        ...row,
        preferences: prefs.recordset
      });
    }

    res.json(optins);
  } catch (err) {
    console.error('Error fetching opt-ins:', err);
    res.status(500).json({ error: 'Failed to fetch opt-ins' });
  }
});

// GET /api/optins/:id - Get opt-in detail
router.get('/optins/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT o.OptInID, o.EmployeeID, o.PhoneNumber, o.ConsentDate, o.IsActive, o.CreatedDate,
               e.FirstName, e.LastName, e.Email, e.Department
        FROM is_sms.OptIns o
        LEFT JOIN dbo.Employees e ON o.EmployeeID = e.EmployeeID
        WHERE o.OptInID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Opt-in not found' });
    }

    const prefs = await pool.request()
      .input('optInId', sql.Int, req.params.id)
      .query('SELECT PreferenceID, NotificationType, IsEnabled FROM is_sms.OptInPreferences WHERE OptInID = @optInId');

    res.json({ ...result.recordset[0], preferences: prefs.recordset });
  } catch (err) {
    console.error('Error fetching opt-in:', err);
    res.status(500).json({ error: 'Failed to fetch opt-in' });
  }
});

// POST /api/optins - Submit opt-in (authenticated)
// BRD 7.1: Employee opts in for emergency text messages, gives consent
router.post('/optins', authenticateToken, [
  body('phoneNumber').matches(/^\d{10}$/).withMessage('Phone number must be 10 digits'),
  body('preferences').isArray({ min: 1 }).withMessage('At least one notification preference required'),
  body('consentAccepted').equals('true').withMessage('Consent must be accepted')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const pool = await getPool();
    const { phoneNumber, preferences } = req.body;
    const employeeId = req.user.employeeId;

    // Check for existing active opt-in
    const existing = await pool.request()
      .input('employeeId', sql.Int, employeeId)
      .query('SELECT OptInID FROM is_sms.OptIns WHERE EmployeeID = @employeeId AND IsActive = 1');

    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'Active opt-in already exists. Use PUT to update preferences.' });
    }

    // Insert opt-in record
    const insertResult = await pool.request()
      .input('employeeId', sql.Int, employeeId)
      .input('phoneNumber', sql.NVarChar(20), phoneNumber)
      .query(`
        INSERT INTO is_sms.OptIns (EmployeeID, PhoneNumber, ConsentDate, IsActive, CreatedDate)
        OUTPUT INSERTED.OptInID
        VALUES (@employeeId, @phoneNumber, GETDATE(), 1, GETDATE())
      `);

    const optInId = insertResult.recordset[0].OptInID;

    // Insert preferences
    for (const pref of preferences) {
      await pool.request()
        .input('optInId', sql.Int, optInId)
        .input('notificationType', sql.NVarChar(100), pref.notificationType)
        .input('isEnabled', sql.Bit, pref.isEnabled ? 1 : 0)
        .query(`
          INSERT INTO is_sms.OptInPreferences (OptInID, NotificationType, IsEnabled)
          VALUES (@optInId, @notificationType, @isEnabled)
        `);
    }

    res.status(201).json({ optInId, message: 'Opt-in submitted successfully' });
  } catch (err) {
    console.error('Error creating opt-in:', err);
    res.status(500).json({ error: 'Failed to create opt-in' });
  }
});

// PUT /api/optins/:id - Update preferences
// BRD 7.1: Update notification preferences
router.put('/optins/:id', authenticateToken, [
  body('phoneNumber').optional().matches(/^\d{10}$/).withMessage('Phone number must be 10 digits'),
  body('preferences').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const pool = await getPool();
    const { phoneNumber, preferences } = req.body;

    // Verify ownership or admin
    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT EmployeeID FROM is_sms.OptIns WHERE OptInID = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'Opt-in not found' });
    }

    if (existing.recordset[0].EmployeeID !== req.user.employeeId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this opt-in' });
    }

    // Update phone number if provided
    if (phoneNumber) {
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('phoneNumber', sql.NVarChar(20), phoneNumber)
        .query('UPDATE is_sms.OptIns SET PhoneNumber = @phoneNumber WHERE OptInID = @id');
    }

    // Update preferences if provided
    if (preferences && preferences.length > 0) {
      await pool.request()
        .input('optInId', sql.Int, req.params.id)
        .query('DELETE FROM is_sms.OptInPreferences WHERE OptInID = @optInId');

      for (const pref of preferences) {
        await pool.request()
          .input('optInId', sql.Int, req.params.id)
          .input('notificationType', sql.NVarChar(100), pref.notificationType)
          .input('isEnabled', sql.Bit, pref.isEnabled ? 1 : 0)
          .query(`
            INSERT INTO is_sms.OptInPreferences (OptInID, NotificationType, IsEnabled)
            VALUES (@optInId, @notificationType, @isEnabled)
          `);
      }
    }

    res.json({ message: 'Opt-in updated successfully' });
  } catch (err) {
    console.error('Error updating opt-in:', err);
    res.status(500).json({ error: 'Failed to update opt-in' });
  }
});

// DELETE /api/optins/:id - Opt-out (soft delete)
// BRD 7.1: Employee can opt out
router.delete('/optins/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();

    // Verify ownership or admin
    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT EmployeeID FROM is_sms.OptIns WHERE OptInID = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'Opt-in not found' });
    }

    if (existing.recordset[0].EmployeeID !== req.user.employeeId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to opt out this record' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('UPDATE is_sms.OptIns SET IsActive = 0 WHERE OptInID = @id');

    res.json({ message: 'Opted out successfully' });
  } catch (err) {
    console.error('Error opting out:', err);
    res.status(500).json({ error: 'Failed to opt out' });
  }
});

module.exports = router;
