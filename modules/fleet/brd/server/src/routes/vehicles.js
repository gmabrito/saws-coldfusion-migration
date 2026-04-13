const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { sql, getPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/vehicles - List vehicles with filters
router.get('/vehicles', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const { status, department, search } = req.query;

    let query = `
      SELECT v.VehicleID, v.VehicleNumber, v.Make, v.Model, v.Year, v.VIN,
             v.DepartmentID, v.Status, v.Mileage, v.AssignedEmployeeID, v.CreatedDate,
             d.DepartmentName,
             e.FirstName + ' ' + e.LastName AS AssignedEmployee
      FROM fleet.Vehicles v
      LEFT JOIN dbo.Departments d ON v.DepartmentID = d.DepartmentID
      LEFT JOIN dbo.Employees e ON v.AssignedEmployeeID = e.EmployeeID
      WHERE 1=1
    `;
    const request = pool.request();

    if (status) {
      query += ` AND v.Status = @status`;
      request.input('status', sql.NVarChar, status);
    }

    if (department) {
      query += ` AND v.DepartmentID = @department`;
      request.input('department', sql.Int, department);
    }

    if (search) {
      query += ` AND (v.VehicleNumber LIKE @search OR v.Make LIKE @search OR v.Model LIKE @search OR v.VIN LIKE @search)`;
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    query += ` ORDER BY v.VehicleNumber`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// GET /api/vehicles/:id - Get vehicle detail with maintenance history
router.get('/vehicles/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();

    const vehicleResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT v.VehicleID, v.VehicleNumber, v.Make, v.Model, v.Year, v.VIN,
               v.DepartmentID, v.Status, v.Mileage, v.AssignedEmployeeID, v.CreatedDate,
               d.DepartmentName,
               e.FirstName + ' ' + e.LastName AS AssignedEmployee
        FROM fleet.Vehicles v
        LEFT JOIN dbo.Departments d ON v.DepartmentID = d.DepartmentID
        LEFT JOIN dbo.Employees e ON v.AssignedEmployeeID = e.EmployeeID
        WHERE v.VehicleID = @id
      `);

    if (vehicleResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const maintenanceResult = await pool.request()
      .input('vehicleId', sql.Int, req.params.id)
      .query(`
        SELECT LogID, MaintenanceDate, MaintenanceType, Description, Cost, Mileage, PerformedBy, CreatedDate
        FROM fleet.MaintenanceLog
        WHERE VehicleID = @vehicleId
        ORDER BY MaintenanceDate DESC
      `);

    res.json({
      ...vehicleResult.recordset[0],
      maintenanceHistory: maintenanceResult.recordset
    });
  } catch (err) {
    console.error('Error fetching vehicle:', err);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// POST /api/vehicles - Add vehicle
router.post('/vehicles', authenticateToken, [
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('make').notEmpty().withMessage('Make is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1990, max: 2030 }).withMessage('Valid year required'),
  body('vin').optional().isLength({ min: 17, max: 17 }).withMessage('VIN must be 17 characters'),
  body('status').isIn(['Active', 'Maintenance', 'Retired']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const pool = await getPool();
    const { vehicleNumber, make, model, year, vin, departmentId, status, mileage, assignedEmployeeId } = req.body;

    const result = await pool.request()
      .input('vehicleNumber', sql.NVarChar(50), vehicleNumber)
      .input('make', sql.NVarChar(50), make)
      .input('model', sql.NVarChar(50), model)
      .input('year', sql.Int, year)
      .input('vin', sql.NVarChar(17), vin || null)
      .input('departmentId', sql.Int, departmentId || null)
      .input('status', sql.NVarChar(20), status)
      .input('mileage', sql.Int, mileage || 0)
      .input('assignedEmployeeId', sql.Int, assignedEmployeeId || null)
      .query(`
        INSERT INTO fleet.Vehicles (VehicleNumber, Make, Model, Year, VIN, DepartmentID, Status, Mileage, AssignedEmployeeID, CreatedDate)
        OUTPUT INSERTED.VehicleID
        VALUES (@vehicleNumber, @make, @model, @year, @vin, @departmentId, @status, @mileage, @assignedEmployeeId, GETDATE())
      `);

    res.status(201).json({ vehicleId: result.recordset[0].VehicleID, message: 'Vehicle added successfully' });
  } catch (err) {
    console.error('Error adding vehicle:', err);
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/vehicles/:id', authenticateToken, [
  body('vehicleNumber').optional().notEmpty(),
  body('status').optional().isIn(['Active', 'Maintenance', 'Retired'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const pool = await getPool();
    const { vehicleNumber, make, model, year, vin, departmentId, status, mileage, assignedEmployeeId } = req.body;

    const existing = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT VehicleID FROM fleet.Vehicles WHERE VehicleID = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('vehicleNumber', sql.NVarChar(50), vehicleNumber)
      .input('make', sql.NVarChar(50), make)
      .input('model', sql.NVarChar(50), model)
      .input('year', sql.Int, year)
      .input('vin', sql.NVarChar(17), vin || null)
      .input('departmentId', sql.Int, departmentId || null)
      .input('status', sql.NVarChar(20), status)
      .input('mileage', sql.Int, mileage || 0)
      .input('assignedEmployeeId', sql.Int, assignedEmployeeId || null)
      .query(`
        UPDATE fleet.Vehicles
        SET VehicleNumber = @vehicleNumber,
            Make = @make,
            Model = @model,
            Year = @year,
            VIN = @vin,
            DepartmentID = @departmentId,
            Status = @status,
            Mileage = @mileage,
            AssignedEmployeeID = @assignedEmployeeId
        WHERE VehicleID = @id
      `);

    res.json({ message: 'Vehicle updated successfully' });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// POST /api/vehicles/:id/maintenance - Log maintenance entry
router.post('/vehicles/:id/maintenance', authenticateToken, [
  body('maintenanceDate').isISO8601().withMessage('Valid date required'),
  body('maintenanceType').notEmpty().withMessage('Maintenance type is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('mileage').isInt({ min: 0 }).withMessage('Mileage must be a positive number')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const pool = await getPool();
    const { maintenanceDate, maintenanceType, description, cost, mileage, performedBy } = req.body;

    // Verify vehicle exists
    const vehicleCheck = await pool.request()
      .input('vehicleId', sql.Int, req.params.id)
      .query('SELECT VehicleID FROM fleet.Vehicles WHERE VehicleID = @vehicleId');

    if (vehicleCheck.recordset.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const result = await pool.request()
      .input('vehicleId', sql.Int, req.params.id)
      .input('maintenanceDate', sql.Date, maintenanceDate)
      .input('maintenanceType', sql.NVarChar(100), maintenanceType)
      .input('description', sql.NVarChar(500), description)
      .input('cost', sql.Decimal(10, 2), cost)
      .input('mileage', sql.Int, mileage)
      .input('performedBy', sql.NVarChar(100), performedBy || null)
      .query(`
        INSERT INTO fleet.MaintenanceLog (VehicleID, MaintenanceDate, MaintenanceType, Description, Cost, Mileage, PerformedBy, CreatedDate)
        OUTPUT INSERTED.LogID
        VALUES (@vehicleId, @maintenanceDate, @maintenanceType, @description, @cost, @mileage, @performedBy, GETDATE())
      `);

    // Update vehicle mileage to latest
    await pool.request()
      .input('vehicleId', sql.Int, req.params.id)
      .input('mileage', sql.Int, mileage)
      .query('UPDATE fleet.Vehicles SET Mileage = @mileage WHERE VehicleID = @vehicleId AND Mileage < @mileage');

    res.status(201).json({ logId: result.recordset[0].LogID, message: 'Maintenance entry logged successfully' });
  } catch (err) {
    console.error('Error logging maintenance:', err);
    res.status(500).json({ error: 'Failed to log maintenance' });
  }
});

module.exports = router;
