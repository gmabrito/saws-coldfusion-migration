const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { sql, getDb } = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Ref: BRD 6.1 - Weekly Job Email: list all active job listings
// GET /api/jobs - list all active job listings (public)
router.get('/', async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('today', sql.DateTime, new Date())
      .query(`
        SELECT ListingID, Title, Department, JobType, SalaryRange, PostedDate, ExpirationDate, Status
        FROM hr.JobListings
        WHERE Status = 'Active'
          AND (ExpirationDate IS NULL OR ExpirationDate >= @today)
        ORDER BY PostedDate DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Failed to fetch job listings' });
  }
});

// GET /api/jobs/:id - get job detail (public)
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Valid listing ID required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('listingId', sql.Int, req.params.id)
      .query(`
        SELECT ListingID, Title, Description, Department, JobType, Requirements,
               SalaryRange, PostedDate, ExpirationDate, Status, CreatedDate
        FROM hr.JobListings
        WHERE ListingID = @listingId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Job listing not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching job detail:', err);
    res.status(500).json({ error: 'Failed to fetch job detail' });
  }
});

// POST /api/jobs - create job listing (auth + admin)
// Ref: BRD 6.1 - "All jobs listed are entered manually"
router.post('/', authenticate, requireRole('ADMIN'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('jobType').isIn(['Internal', 'External']).withMessage('Job type must be Internal or External'),
  body('requirements').optional().trim(),
  body('salaryRange').optional().trim(),
  body('expirationDate').optional({ nullable: true }).isISO8601().withMessage('Valid expiration date required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, department, jobType, requirements, salaryRange, expirationDate } = req.body;
    const pool = await getDb();
    const result = await pool.request()
      .input('title', sql.NVarChar(200), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('department', sql.NVarChar(100), department)
      .input('jobType', sql.NVarChar(20), jobType)
      .input('requirements', sql.NVarChar(sql.MAX), requirements || null)
      .input('salaryRange', sql.NVarChar(100), salaryRange || null)
      .input('expirationDate', sql.DateTime, expirationDate || null)
      .input('createdBy', sql.Int, req.user.employeeId)
      .query(`
        INSERT INTO hr.JobListings (Title, Description, Department, JobType, Requirements, SalaryRange, ExpirationDate, Status, CreatedByEmployeeID, PostedDate, CreatedDate)
        OUTPUT INSERTED.ListingID
        VALUES (@title, @description, @department, @jobType, @requirements, @salaryRange, @expirationDate, 'Active', @createdBy, GETDATE(), GETDATE())
      `);

    res.status(201).json({ listingId: result.recordset[0].ListingID, message: 'Job listing created' });
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'Failed to create job listing' });
  }
});

// PUT /api/jobs/:id - update job listing (auth + admin)
router.put('/:id', authenticate, requireRole('ADMIN'), [
  param('id').isInt({ min: 1 }).withMessage('Valid listing ID required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('jobType').isIn(['Internal', 'External']).withMessage('Job type must be Internal or External'),
  body('requirements').optional().trim(),
  body('salaryRange').optional().trim(),
  body('status').optional().isIn(['Active', 'Closed', 'Draft']).withMessage('Invalid status'),
  body('expirationDate').optional({ nullable: true }).isISO8601().withMessage('Valid expiration date required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, department, jobType, requirements, salaryRange, status, expirationDate } = req.body;
    const pool = await getDb();
    const result = await pool.request()
      .input('listingId', sql.Int, req.params.id)
      .input('title', sql.NVarChar(200), title)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('department', sql.NVarChar(100), department)
      .input('jobType', sql.NVarChar(20), jobType)
      .input('requirements', sql.NVarChar(sql.MAX), requirements || null)
      .input('salaryRange', sql.NVarChar(100), salaryRange || null)
      .input('status', sql.NVarChar(20), status || 'Active')
      .input('expirationDate', sql.DateTime, expirationDate || null)
      .query(`
        UPDATE hr.JobListings
        SET Title = @title, Description = @description, Department = @department,
            JobType = @jobType, Requirements = @requirements, SalaryRange = @salaryRange,
            Status = @status, ExpirationDate = @expirationDate
        WHERE ListingID = @listingId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Job listing not found' });
    }
    res.json({ message: 'Job listing updated' });
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ error: 'Failed to update job listing' });
  }
});

// DELETE /api/jobs/:id - remove job listing (auth + admin)
router.delete('/:id', authenticate, requireRole('ADMIN'), [
  param('id').isInt({ min: 1 }).withMessage('Valid listing ID required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('listingId', sql.Int, req.params.id)
      .query('DELETE FROM hr.JobListings WHERE ListingID = @listingId');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Job listing not found' });
    }
    res.json({ message: 'Job listing deleted' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ error: 'Failed to delete job listing' });
  }
});

// POST /api/jobs/generate-email - generate weekly email content (auth + admin)
// Ref: BRD 6.1 - "weekly job emails are generated and sent out Friday afternoon"
router.post('/generate-email', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request()
      .input('today', sql.DateTime, new Date())
      .query(`
        SELECT ListingID, Title, Description, Department, JobType, Requirements, SalaryRange, PostedDate
        FROM hr.JobListings
        WHERE Status = 'Active'
          AND (ExpirationDate IS NULL OR ExpirationDate >= @today)
        ORDER BY JobType, Department, PostedDate DESC
      `);

    const listings = result.recordset;

    const internalJobs = listings.filter((j) => j.JobType === 'Internal');
    const externalJobs = listings.filter((j) => j.JobType === 'External');

    // Build email HTML content
    let emailHtml = `<h2>SAWS Weekly Job Listings</h2>`;
    emailHtml += `<p>Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`;

    if (internalJobs.length > 0) {
      emailHtml += `<h3>Internal Positions</h3>`;
      internalJobs.forEach((job) => {
        emailHtml += `<div style="margin-bottom:16px;padding:12px;border:1px solid #ddd;border-radius:4px;">`;
        emailHtml += `<h4 style="color:#005A87;margin:0 0 4px 0;">${job.Title}</h4>`;
        emailHtml += `<p style="margin:2px 0;color:#666;"><strong>Department:</strong> ${job.Department}</p>`;
        if (job.SalaryRange) emailHtml += `<p style="margin:2px 0;color:#666;"><strong>Salary Range:</strong> ${job.SalaryRange}</p>`;
        emailHtml += `<p style="margin:8px 0 0 0;">${job.Description}</p>`;
        if (job.Requirements) emailHtml += `<p style="margin:4px 0 0 0;"><strong>Requirements:</strong> ${job.Requirements}</p>`;
        emailHtml += `</div>`;
      });
    }

    if (externalJobs.length > 0) {
      emailHtml += `<h3>External Positions</h3>`;
      externalJobs.forEach((job) => {
        emailHtml += `<div style="margin-bottom:16px;padding:12px;border:1px solid #ddd;border-radius:4px;">`;
        emailHtml += `<h4 style="color:#005A87;margin:0 0 4px 0;">${job.Title}</h4>`;
        emailHtml += `<p style="margin:2px 0;color:#666;"><strong>Department:</strong> ${job.Department}</p>`;
        if (job.SalaryRange) emailHtml += `<p style="margin:2px 0;color:#666;"><strong>Salary Range:</strong> ${job.SalaryRange}</p>`;
        emailHtml += `<p style="margin:8px 0 0 0;">${job.Description}</p>`;
        if (job.Requirements) emailHtml += `<p style="margin:4px 0 0 0;"><strong>Requirements:</strong> ${job.Requirements}</p>`;
        emailHtml += `</div>`;
      });
    }

    if (listings.length === 0) {
      emailHtml += `<p>No active job listings at this time.</p>`;
    }

    emailHtml += `<hr/><p style="font-size:12px;color:#999;">San Antonio Water System - Human Resources Department</p>`;

    res.json({
      subject: `SAWS Weekly Job Listings - ${new Date().toLocaleDateString('en-US')}`,
      htmlContent: emailHtml,
      totalListings: listings.length,
      internalCount: internalJobs.length,
      externalCount: externalJobs.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error generating email:', err);
    res.status(500).json({ error: 'Failed to generate weekly email' });
  }
});

module.exports = router;
