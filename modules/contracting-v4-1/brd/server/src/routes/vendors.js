const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const { sql, getDb } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper: return validation errors or null.
 */
function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// GET /api/vendors - Search vendors with optional filters
// Ref: BRD 6.1 - search vendor profiles (by name, category, etc.)
// ---------------------------------------------------------------------------
router.get(
  '/',
  authenticate,
  [
    query('name').optional().trim().escape(),
    query('category').optional().trim().escape(),
    query('status').optional().isIn(['Active', 'Inactive', 'Pending']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    try {
      const pool = await getDb();
      const request = pool.request();

      let where = [];
      if (req.query.name) {
        request.input('name', sql.NVarChar, `%${req.query.name}%`);
        where.push('(v.BusinessName LIKE @name OR v.ContactName LIKE @name)');
      }
      if (req.query.category) {
        request.input('category', sql.NVarChar, req.query.category);
        where.push('vc.CategoryName = @category');
      }
      if (req.query.status) {
        request.input('status', sql.NVarChar, req.query.status);
        where.push('v.Status = @status');
      }

      const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
      const page = req.query.page || 1;
      const limit = req.query.limit || 25;
      const offset = (page - 1) * limit;

      // Count query
      const countResult = await request.query(`
        SELECT COUNT(*) AS total
        FROM contracting.Vendors v
        LEFT JOIN contracting.VendorCategories vc ON v.CategoryID = vc.CategoryID
        ${whereClause}
      `);
      const total = countResult.recordset[0].total;

      // Data query (new request to re-bind params)
      const dataRequest = pool.request();
      if (req.query.name) dataRequest.input('name', sql.NVarChar, `%${req.query.name}%`);
      if (req.query.category) dataRequest.input('category', sql.NVarChar, req.query.category);
      if (req.query.status) dataRequest.input('status', sql.NVarChar, req.query.status);
      dataRequest.input('offset', sql.Int, offset);
      dataRequest.input('limit', sql.Int, limit);

      const result = await dataRequest.query(`
        SELECT v.VendorID, v.BusinessName, v.ContactName, v.Email, v.Phone,
               v.Address, v.City, v.State, v.Zip, v.Status,
               v.RegistrationDate, vc.CategoryName
        FROM contracting.Vendors v
        LEFT JOIN contracting.VendorCategories vc ON v.CategoryID = vc.CategoryID
        ${whereClause}
        ORDER BY v.BusinessName
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

      res.json({
        vendors: result.recordset,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      console.error('Error searching vendors:', err);
      res.status(500).json({ error: 'Failed to search vendors' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/vendors/export - Export search results as CSV
// Ref: BRD 6.1 - output results to Excel spreadsheets
// ---------------------------------------------------------------------------
router.get(
  '/export',
  authenticate,
  [
    query('name').optional().trim().escape(),
    query('category').optional().trim().escape(),
    query('status').optional().isIn(['Active', 'Inactive', 'Pending'])
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    try {
      const pool = await getDb();
      const request = pool.request();

      let where = [];
      if (req.query.name) {
        request.input('name', sql.NVarChar, `%${req.query.name}%`);
        where.push('(v.BusinessName LIKE @name OR v.ContactName LIKE @name)');
      }
      if (req.query.category) {
        request.input('category', sql.NVarChar, req.query.category);
        where.push('vc.CategoryName = @category');
      }
      if (req.query.status) {
        request.input('status', sql.NVarChar, req.query.status);
        where.push('v.Status = @status');
      }

      const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

      const result = await request.query(`
        SELECT v.VendorID, v.BusinessName, v.ContactName, v.Email, v.Phone,
               v.Address, v.City, v.State, v.Zip, v.Status,
               v.RegistrationDate, vc.CategoryName
        FROM contracting.Vendors v
        LEFT JOIN contracting.VendorCategories vc ON v.CategoryID = vc.CategoryID
        ${whereClause}
        ORDER BY v.BusinessName
      `);

      const rows = result.recordset;
      if (rows.length === 0) {
        return res.status(404).json({ error: 'No vendors found for export' });
      }

      // Build CSV
      const headers = [
        'VendorID', 'BusinessName', 'ContactName', 'Email', 'Phone',
        'Address', 'City', 'State', 'Zip', 'Status', 'RegistrationDate', 'Category'
      ];
      const csvLines = [headers.join(',')];
      for (const row of rows) {
        const line = [
          row.VendorID,
          `"${(row.BusinessName || '').replace(/"/g, '""')}"`,
          `"${(row.ContactName || '').replace(/"/g, '""')}"`,
          `"${(row.Email || '').replace(/"/g, '""')}"`,
          `"${(row.Phone || '').replace(/"/g, '""')}"`,
          `"${(row.Address || '').replace(/"/g, '""')}"`,
          `"${(row.City || '').replace(/"/g, '""')}"`,
          row.State,
          row.Zip,
          row.Status,
          row.RegistrationDate ? new Date(row.RegistrationDate).toISOString().split('T')[0] : '',
          `"${(row.CategoryName || '').replace(/"/g, '""')}"`
        ].join(',');
        csvLines.push(line);
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vendors_export.csv"');
      res.send(csvLines.join('\r\n'));
    } catch (err) {
      console.error('Error exporting vendors:', err);
      res.status(500).json({ error: 'Failed to export vendors' });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/vendors/categories - Get all vendor categories
// ---------------------------------------------------------------------------
router.get('/categories', authenticate, async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(`
      SELECT CategoryID, CategoryName, Description
      FROM contracting.VendorCategories
      ORDER BY CategoryName
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/vendors/:id - Get vendor detail
// Ref: BRD 6.1 - view vendor profiles
// ---------------------------------------------------------------------------
router.get(
  '/:id',
  authenticate,
  [param('id').isInt().toInt()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query(`
          SELECT v.VendorID, v.BusinessName, v.ContactName, v.Email, v.Phone,
                 v.Address, v.City, v.State, v.Zip, v.CategoryID, v.Status,
                 v.RegistrationDate, v.LastLoginDate, v.Notes,
                 vc.CategoryName, vc.Description AS CategoryDescription
          FROM contracting.Vendors v
          LEFT JOIN contracting.VendorCategories vc ON v.CategoryID = vc.CategoryID
          WHERE v.VendorID = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Error fetching vendor:', err);
      res.status(500).json({ error: 'Failed to fetch vendor' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/vendors - Create vendor
// ---------------------------------------------------------------------------
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  [
    body('businessName').notEmpty().trim().isLength({ max: 200 }),
    body('contactName').notEmpty().trim().isLength({ max: 150 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('address').optional().trim().isLength({ max: 255 }),
    body('city').optional().trim().isLength({ max: 100 }),
    body('state').optional().trim().isLength({ min: 2, max: 2 }),
    body('zip').optional().trim().isLength({ max: 10 }),
    body('categoryId').optional().isInt().toInt(),
    body('status').optional().isIn(['Active', 'Inactive', 'Pending']),
    body('notes').optional().trim()
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    try {
      const pool = await getDb();
      const {
        businessName, contactName, email, phone,
        address, city, state, zip, categoryId, status, notes
      } = req.body;

      const result = await pool.request()
        .input('businessName', sql.NVarChar, businessName)
        .input('contactName', sql.NVarChar, contactName)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, phone || null)
        .input('address', sql.NVarChar, address || null)
        .input('city', sql.NVarChar, city || null)
        .input('state', sql.NVarChar, state || null)
        .input('zip', sql.NVarChar, zip || null)
        .input('categoryId', sql.Int, categoryId || null)
        .input('status', sql.NVarChar, status || 'Pending')
        .input('notes', sql.NVarChar, notes || null)
        .query(`
          INSERT INTO contracting.Vendors
            (BusinessName, ContactName, Email, Phone, Address, City, State, Zip,
             CategoryID, Status, RegistrationDate, Notes)
          OUTPUT INSERTED.VendorID
          VALUES
            (@businessName, @contactName, @email, @phone, @address, @city, @state, @zip,
             @categoryId, @status, GETDATE(), @notes)
        `);

      const vendorId = result.recordset[0].VendorID;
      res.status(201).json({ message: 'Vendor created successfully', vendorId });
    } catch (err) {
      console.error('Error creating vendor:', err);
      res.status(500).json({ error: 'Failed to create vendor' });
    }
  }
);

// ---------------------------------------------------------------------------
// PUT /api/vendors/:id - Update vendor profile
// Ref: BRD 6.1 - edit / update contact information
// ---------------------------------------------------------------------------
router.put(
  '/:id',
  authenticate,
  requireRole('admin'),
  [
    param('id').isInt().toInt(),
    body('businessName').optional().trim().isLength({ max: 200 }),
    body('contactName').optional().trim().isLength({ max: 150 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ max: 20 }),
    body('address').optional().trim().isLength({ max: 255 }),
    body('city').optional().trim().isLength({ max: 100 }),
    body('state').optional().trim().isLength({ min: 2, max: 2 }),
    body('zip').optional().trim().isLength({ max: 10 }),
    body('categoryId').optional().isInt().toInt(),
    body('status').optional().isIn(['Active', 'Inactive', 'Pending']),
    body('notes').optional().trim()
  ],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    try {
      const pool = await getDb();
      const {
        businessName, contactName, email, phone,
        address, city, state, zip, categoryId, status, notes
      } = req.body;

      // Build dynamic SET clause for only provided fields
      const setClauses = [];
      const request = pool.request();
      request.input('id', sql.Int, req.params.id);

      if (businessName !== undefined) {
        request.input('businessName', sql.NVarChar, businessName);
        setClauses.push('BusinessName = @businessName');
      }
      if (contactName !== undefined) {
        request.input('contactName', sql.NVarChar, contactName);
        setClauses.push('ContactName = @contactName');
      }
      if (email !== undefined) {
        request.input('email', sql.NVarChar, email);
        setClauses.push('Email = @email');
      }
      if (phone !== undefined) {
        request.input('phone', sql.NVarChar, phone);
        setClauses.push('Phone = @phone');
      }
      if (address !== undefined) {
        request.input('address', sql.NVarChar, address);
        setClauses.push('Address = @address');
      }
      if (city !== undefined) {
        request.input('city', sql.NVarChar, city);
        setClauses.push('City = @city');
      }
      if (state !== undefined) {
        request.input('state', sql.NVarChar, state);
        setClauses.push('State = @state');
      }
      if (zip !== undefined) {
        request.input('zip', sql.NVarChar, zip);
        setClauses.push('Zip = @zip');
      }
      if (categoryId !== undefined) {
        request.input('categoryId', sql.Int, categoryId);
        setClauses.push('CategoryID = @categoryId');
      }
      if (status !== undefined) {
        request.input('status', sql.NVarChar, status);
        setClauses.push('Status = @status');
      }
      if (notes !== undefined) {
        request.input('notes', sql.NVarChar, notes);
        setClauses.push('Notes = @notes');
      }

      if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const result = await request.query(`
        UPDATE contracting.Vendors
        SET ${setClauses.join(', ')}
        WHERE VendorID = @id
      `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json({ message: 'Vendor updated successfully' });
    } catch (err) {
      console.error('Error updating vendor:', err);
      res.status(500).json({ error: 'Failed to update vendor' });
    }
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/vendors/:id - Remove vendor profile
// Ref: BRD 6.1 - remove vendor profiles
// ---------------------------------------------------------------------------
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  [param('id').isInt().toInt()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM contracting.Vendors WHERE VendorID = @id');

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      res.json({ message: 'Vendor removed successfully' });
    } catch (err) {
      console.error('Error removing vendor:', err);
      res.status(500).json({ error: 'Failed to remove vendor' });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/vendors/:id/reset-password - Reset vendor password
// Ref: BRD 6.1 - reset passwords
// ---------------------------------------------------------------------------
router.post(
  '/:id/reset-password',
  authenticate,
  requireRole('admin'),
  [param('id').isInt().toInt()],
  async (req, res) => {
    if (!checkValidation(req, res)) return;

    try {
      const pool = await getDb();

      // Verify vendor exists
      const vendor = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT VendorID, Email, BusinessName FROM contracting.Vendors WHERE VendorID = @id');

      if (vendor.recordset.length === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // Generate a temporary password and update
      const tempPassword = Math.random().toString(36).slice(-10);
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('tempPassword', sql.NVarChar, tempPassword)
        .input('resetDate', sql.DateTime, new Date())
        .query(`
          UPDATE contracting.Vendors
          SET PasswordHash = @tempPassword, PasswordResetDate = @resetDate
          WHERE VendorID = @id
        `);

      res.json({
        message: 'Password reset successfully',
        vendor: vendor.recordset[0].BusinessName,
        temporaryPassword: tempPassword
      });
    } catch (err) {
      console.error('Error resetting password:', err);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

module.exports = router;
