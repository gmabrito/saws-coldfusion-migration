const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { sql, getDb } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/maps - list available maps (filter by category, area)
router.get('/', async (req, res) => {
  try {
    const pool = await getDb();
    const request = pool.request();

    let where = [];
    if (req.query.category) {
      request.input('categoryId', sql.Int, parseInt(req.query.category));
      where.push('m.CategoryID = @categoryId');
    }
    if (req.query.area) {
      request.input('area', sql.NVarChar, `%${req.query.area}%`);
      where.push('m.Area LIKE @area');
    }
    if (req.query.search) {
      request.input('search', sql.NVarChar, `%${req.query.search}%`);
      where.push('(m.Title LIKE @search OR m.Description LIKE @search)');
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const result = await request.query(`
      SELECT m.MapID, m.Title, m.Area, m.Description, m.FileUrl, m.FileType,
             m.LastUpdated, m.CreatedDate,
             mc.CategoryName, mc.CategoryID,
             e.FirstName + ' ' + e.LastName AS CreatedBy
      FROM utilitymaps.Maps m
      LEFT JOIN utilitymaps.MapCategories mc ON m.CategoryID = mc.CategoryID
      LEFT JOIN dbo.Employees e ON m.CreatedByEmployeeID = e.EmployeeID
      ${whereClause}
      ORDER BY m.LastUpdated DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching maps:', err);
    res.status(500).json({ error: 'Failed to fetch maps' });
  }
});

// GET /api/maps/categories - list categories for filter dropdown
router.get('/categories', async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(`
      SELECT CategoryID, CategoryName, Description
      FROM utilitymaps.MapCategories
      ORDER BY CategoryName
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/maps/:id - get map detail with layers
router.get('/:id',
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query(`
          SELECT m.*, mc.CategoryName, mc.Description AS CategoryDescription,
                 e.FirstName + ' ' + e.LastName AS CreatedBy,
                 e.Email AS CreatedByEmail
          FROM utilitymaps.Maps m
          LEFT JOIN utilitymaps.MapCategories mc ON m.CategoryID = mc.CategoryID
          LEFT JOIN dbo.Employees e ON m.CreatedByEmployeeID = e.EmployeeID
          WHERE m.MapID = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Map not found' });
      }
      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Error fetching map:', err);
      res.status(500).json({ error: 'Failed to fetch map' });
    }
  }
);

// POST /api/maps - create map entry (auth required)
router.post('/',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('categoryId').isInt().withMessage('Category is required'),
    body('area').trim().notEmpty().withMessage('Area is required'),
    body('fileUrl').trim().notEmpty().withMessage('File URL is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pool = await getDb();
      const { title, categoryId, area, description, fileUrl, fileType } = req.body;

      const result = await pool.request()
        .input('title', sql.NVarChar, title)
        .input('categoryId', sql.Int, categoryId)
        .input('area', sql.NVarChar, area)
        .input('description', sql.NVarChar, description || null)
        .input('fileUrl', sql.NVarChar, fileUrl)
        .input('fileType', sql.NVarChar, fileType || 'PDF')
        .input('employeeId', sql.Int, req.user.employeeId)
        .query(`
          INSERT INTO utilitymaps.Maps
            (Title, CategoryID, Area, Description, FileUrl, FileType,
             CreatedByEmployeeID, LastUpdated, CreatedDate, ModifiedDate)
          OUTPUT INSERTED.MapID
          VALUES
            (@title, @categoryId, @area, @description, @fileUrl, @fileType,
             @employeeId, GETDATE(), GETDATE(), GETDATE())
        `);

      res.status(201).json({ mapId: result.recordset[0].MapID, message: 'Map created successfully' });
    } catch (err) {
      console.error('Error creating map:', err);
      res.status(500).json({ error: 'Failed to create map' });
    }
  }
);

// PUT /api/maps/:id - update map metadata
router.put('/:id',
  authenticate,
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pool = await getDb();
      const { title, categoryId, area, description, fileUrl, fileType } = req.body;

      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('title', sql.NVarChar, title)
        .input('categoryId', sql.Int, categoryId)
        .input('area', sql.NVarChar, area)
        .input('description', sql.NVarChar, description || null)
        .input('fileUrl', sql.NVarChar, fileUrl)
        .input('fileType', sql.NVarChar, fileType || 'PDF')
        .query(`
          UPDATE utilitymaps.Maps
          SET Title = @title,
              CategoryID = @categoryId,
              Area = @area,
              Description = @description,
              FileUrl = @fileUrl,
              FileType = @fileType,
              LastUpdated = GETDATE(),
              ModifiedDate = GETDATE()
          WHERE MapID = @id;
          SELECT @@ROWCOUNT AS affected;
        `);

      if (result.recordset[0].affected === 0) {
        return res.status(404).json({ error: 'Map not found' });
      }
      res.json({ message: 'Map updated successfully' });
    } catch (err) {
      console.error('Error updating map:', err);
      res.status(500).json({ error: 'Failed to update map' });
    }
  }
);

// DELETE /api/maps/:id - remove map
router.delete('/:id',
  authenticate,
  param('id').isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const pool = await getDb();
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query(`
          DELETE FROM utilitymaps.Maps WHERE MapID = @id;
          SELECT @@ROWCOUNT AS affected;
        `);

      if (result.recordset[0].affected === 0) {
        return res.status(404).json({ error: 'Map not found' });
      }
      res.json({ message: 'Map deleted successfully' });
    } catch (err) {
      console.error('Error deleting map:', err);
      res.status(500).json({ error: 'Failed to delete map' });
    }
  }
);

module.exports = router;
