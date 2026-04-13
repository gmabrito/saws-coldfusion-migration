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

const contractorValidation = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('contactName').trim().notEmpty().withMessage('Contact name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Valid email is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  body('licenseType')
    .isIn(['Contractor', 'Plumber', 'Both'])
    .withMessage('License type must be Contractor, Plumber, or Both'),
  body('authorizationDate').isISO8601().withMessage('Valid authorization date is required'),
  body('expirationDate').isISO8601().withMessage('Valid expiration date is required'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Suspended', 'Expired'])
    .withMessage('Invalid status'),
  body('notes').optional().trim(),
];

// BRD 7.2 - GET /api/contractors - List all authorized contractors/plumbers
router.get('/', authenticate, async (req, res) => {
  try {
    const pool = await getDb();
    const request = pool.request();

    let whereClause = '';
    const conditions = [];

    // Optional search filter
    if (req.query.search) {
      request.input('search', sql.NVarChar(200), `%${req.query.search}%`);
      conditions.push(
        '(CompanyName LIKE @search OR ContactName LIKE @search OR LicenseNumber LIKE @search)'
      );
    }

    // Optional status filter
    if (req.query.status) {
      request.input('statusFilter', sql.NVarChar(50), req.query.status);
      conditions.push('Status = @statusFilter');
    }

    // Optional license type filter
    if (req.query.licenseType) {
      request.input('licenseTypeFilter', sql.NVarChar(50), req.query.licenseType);
      conditions.push('LicenseType = @licenseTypeFilter');
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const result = await request.query(`
      SELECT ContractorID, CompanyName, ContactName, Phone, Email,
             LicenseNumber, LicenseType, AuthorizationDate, ExpirationDate,
             Status, Notes
      FROM development.ContractorRegistry
      ${whereClause}
      ORDER BY CompanyName ASC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching contractors:', err);
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
});

// BRD 7.2 - GET /api/contractors/:id - Get contractor detail
router.get('/:id', authenticate, [
  param('id').isInt().withMessage('Valid contractor ID is required'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('contractorId', sql.Int, req.params.id)
      .query(`
        SELECT ContractorID, CompanyName, ContactName, Phone, Email,
               LicenseNumber, LicenseType, AuthorizationDate, ExpirationDate,
               Status, Notes
        FROM development.ContractorRegistry
        WHERE ContractorID = @contractorId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching contractor:', err);
    res.status(500).json({ error: 'Failed to fetch contractor detail' });
  }
});

// BRD 7.2 - POST /api/contractors - Register new contractor
router.post('/', authenticate, contractorValidation, async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const {
      companyName, contactName, phone, email,
      licenseNumber, licenseType, authorizationDate,
      expirationDate, status, notes,
    } = req.body;

    const pool = await getDb();

    const result = await pool.request()
      .input('companyName', sql.NVarChar(200), companyName)
      .input('contactName', sql.NVarChar(200), contactName)
      .input('phone', sql.NVarChar(20), phone)
      .input('email', sql.NVarChar(200), email || null)
      .input('licenseNumber', sql.NVarChar(50), licenseNumber)
      .input('licenseType', sql.NVarChar(50), licenseType)
      .input('authorizationDate', sql.Date, authorizationDate)
      .input('expirationDate', sql.Date, expirationDate)
      .input('status', sql.NVarChar(50), status || 'Active')
      .input('notes', sql.NVarChar(sql.MAX), notes || null)
      .query(`
        INSERT INTO development.ContractorRegistry
          (CompanyName, ContactName, Phone, Email, LicenseNumber, LicenseType,
           AuthorizationDate, ExpirationDate, Status, Notes)
        VALUES
          (@companyName, @contactName, @phone, @email, @licenseNumber, @licenseType,
           @authorizationDate, @expirationDate, @status, @notes);
        SELECT SCOPE_IDENTITY() AS ContractorID;
      `);

    res.status(201).json({
      message: 'Contractor registered successfully',
      contractorId: result.recordset[0].ContractorID,
    });
  } catch (err) {
    console.error('Error creating contractor:', err);
    res.status(500).json({ error: 'Failed to register contractor' });
  }
});

// BRD 7.2 - PUT /api/contractors/:id - Update contractor
router.put('/:id', authenticate, [
  param('id').isInt().withMessage('Valid contractor ID is required'),
  ...contractorValidation,
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const {
      companyName, contactName, phone, email,
      licenseNumber, licenseType, authorizationDate,
      expirationDate, status, notes,
    } = req.body;

    const pool = await getDb();

    const result = await pool.request()
      .input('contractorId', sql.Int, req.params.id)
      .input('companyName', sql.NVarChar(200), companyName)
      .input('contactName', sql.NVarChar(200), contactName)
      .input('phone', sql.NVarChar(20), phone)
      .input('email', sql.NVarChar(200), email || null)
      .input('licenseNumber', sql.NVarChar(50), licenseNumber)
      .input('licenseType', sql.NVarChar(50), licenseType)
      .input('authorizationDate', sql.Date, authorizationDate)
      .input('expirationDate', sql.Date, expirationDate)
      .input('status', sql.NVarChar(50), status || 'Active')
      .input('notes', sql.NVarChar(sql.MAX), notes || null)
      .query(`
        UPDATE development.ContractorRegistry
        SET CompanyName = @companyName,
            ContactName = @contactName,
            Phone = @phone,
            Email = @email,
            LicenseNumber = @licenseNumber,
            LicenseType = @licenseType,
            AuthorizationDate = @authorizationDate,
            ExpirationDate = @expirationDate,
            Status = @status,
            Notes = @notes
        WHERE ContractorID = @contractorId;
        SELECT @@ROWCOUNT AS affected;
      `);

    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    res.json({ message: 'Contractor updated successfully' });
  } catch (err) {
    console.error('Error updating contractor:', err);
    res.status(500).json({ error: 'Failed to update contractor' });
  }
});

// BRD 7.2 - DELETE /api/contractors/:id - Remove contractor
router.delete('/:id', authenticate, requireRole('Admin'), [
  param('id').isInt().withMessage('Valid contractor ID is required'),
], async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('contractorId', sql.Int, req.params.id)
      .query(`
        DELETE FROM development.ContractorRegistry
        WHERE ContractorID = @contractorId;
        SELECT @@ROWCOUNT AS affected;
      `);

    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    res.json({ message: 'Contractor removed successfully' });
  } catch (err) {
    console.error('Error deleting contractor:', err);
    res.status(500).json({ error: 'Failed to remove contractor' });
  }
});

module.exports = router;
