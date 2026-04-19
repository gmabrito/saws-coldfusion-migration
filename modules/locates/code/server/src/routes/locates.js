'use strict';

/**
 * Locates routes
 *
 * POST /api/locates      — PUBLIC: submit a new locate request (no auth)
 * GET  /api/locates      — STAFF ONLY: list all locate requests
 * PATCH /api/locates/:id — STAFF ONLY: update status / assigned_to
 * POST /api/auth/login   — PUBLIC: staff login → JWT
 */

const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { optionalAuth, requireAuth, requireStaff } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'locates-dev-secret-change-in-production';

// ── In-memory stub store ────────────────────────────────────────────────────

let locateCounter = 5; // already have 5 stub records

const STUB_LOCATES = [
  {
    id: 1,
    locate_number: 'LOC-2026-001',
    status: 'pending',
    first_name: 'Maria',
    last_name: 'Hernandez',
    company: 'Hernandez Landscaping LLC',
    phone: '210-555-0101',
    email: 'maria@hernandezland.com',
    address: '445 Huebner Rd',
    city: 'San Antonio',
    county: 'Bexar',
    nearest_cross_street: 'Vance Jackson Rd',
    work_type: 'Residential',
    excavation_method: 'Hand Dig',
    planned_start_date: '2026-04-25',
    planned_duration: '1 day',
    depth_ft: 2,
    width_ft: 1,
    notes: 'Installing sprinkler system in front yard.',
    assigned_to: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    _stub: true,
  },
  {
    id: 2,
    locate_number: 'LOC-2026-002',
    status: 'pending',
    first_name: 'James',
    last_name: 'Okafor',
    company: 'Okafor Construction Group',
    phone: '210-555-0188',
    email: 'james@okafor-const.com',
    address: '1234 Broadway',
    city: 'San Antonio',
    county: 'Bexar',
    nearest_cross_street: 'Hildebrand Ave',
    work_type: 'Commercial',
    excavation_method: 'Mechanical Excavation',
    planned_start_date: '2026-04-26',
    planned_duration: '2-3 days',
    depth_ft: 6,
    width_ft: 4,
    notes: 'Trenching for new electrical conduit to commercial building.',
    assigned_to: null,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    _stub: true,
  },
  {
    id: 3,
    locate_number: 'LOC-2026-003',
    status: 'assigned',
    first_name: 'Tom',
    last_name: 'Briggs',
    company: 'City of San Antonio Public Works',
    phone: '210-555-0142',
    email: 'tbriggs@sanantonio.gov',
    address: '890 Fredericksburg Rd',
    city: 'San Antonio',
    county: 'Bexar',
    nearest_cross_street: 'Culebra Rd',
    work_type: 'Road Work',
    excavation_method: 'Mechanical Excavation',
    planned_start_date: '2026-04-28',
    planned_duration: '1 week',
    depth_ft: 4,
    width_ft: 8,
    notes: 'Road resurfacing — utility conflict check required.',
    assigned_to: 'R. Castillo',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    _stub: true,
  },
  {
    id: 4,
    locate_number: 'LOC-2026-004',
    status: 'in-progress',
    first_name: 'Sandra',
    last_name: 'Nguyen',
    company: 'TxBore Directional Drilling',
    phone: '210-555-0167',
    email: 's.nguyen@txbore.com',
    address: '78 SW Loop 410',
    city: 'San Antonio',
    county: 'Bexar',
    nearest_cross_street: 'Ingram Rd',
    work_type: 'Other',
    excavation_method: 'Boring/Directional Drilling',
    planned_start_date: '2026-04-22',
    planned_duration: 'more than 1 week',
    depth_ft: 12,
    width_ft: 3,
    notes: 'HDD bore under Loop 410 for fiber conduit crossing.',
    assigned_to: 'M. Torres',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    _stub: true,
  },
  {
    id: 5,
    locate_number: 'LOC-2026-005',
    status: 'completed',
    first_name: 'David',
    last_name: 'Pittman',
    company: 'Pittman Properties',
    phone: '210-555-0122',
    email: 'dpittman@pittmanprops.com',
    address: '2233 NW Military Hwy',
    city: 'San Antonio',
    county: 'Bexar',
    nearest_cross_street: 'Lockhill Selma Rd',
    work_type: 'Landscaping',
    excavation_method: 'Hand Dig',
    planned_start_date: '2026-04-19',
    planned_duration: '1 day',
    depth_ft: 1,
    width_ft: 1,
    notes: 'Planting trees along property line.',
    assigned_to: 'R. Castillo',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    _stub: true,
  },
];

// ── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/auth/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  // Stub: any credentials accepted — replace with real auth post-PoC
  const user = { name: 'Demo Staff', email, role: 'staff' };
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });

  res.json({ token, user });
});

// ── POST /api/locates ────────────────────────────────────────────────────────
// PUBLIC — no auth required

router.post('/locates', [
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
  body('phone').notEmpty().trim().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('address').notEmpty().trim().withMessage('Address is required'),
  body('city').notEmpty().trim().withMessage('City is required'),
  body('work_type').notEmpty().withMessage('Work type is required'),
  body('excavation_method').notEmpty().withMessage('Excavation method is required'),
  body('planned_start_date').notEmpty().withMessage('Planned start date is required'),
  body('planned_duration').notEmpty().withMessage('Planned duration is required'),
  body('acknowledged').equals('true').withMessage('You must acknowledge the 3-business-day requirement'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  locateCounter += 1;
  const paddedNum = String(locateCounter).padStart(3, '0');
  const year = new Date().getFullYear();
  const locate_number = `LOC-${year}-${paddedNum}`;

  const record = {
    id: locateCounter,
    locate_number,
    status: 'pending',
    ...req.body,
    assigned_to: null,
    created_at: new Date().toISOString(),
    _stub: true,
  };

  STUB_LOCATES.push(record);

  res.status(201).json({
    locate_number,
    message: 'Your locate request has been submitted successfully.',
    estimated_response: '1-3 business days',
    record,
  });
});

// ── GET /api/locates ─────────────────────────────────────────────────────────
// STAFF ONLY

router.get('/locates', requireAuth, requireStaff, (req, res) => {
  res.json(STUB_LOCATES);
});

// ── PATCH /api/locates/:id ───────────────────────────────────────────────────
// STAFF ONLY

router.patch('/locates/:id', requireAuth, requireStaff, [
  body('status').notEmpty().withMessage('Status is required'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const id = parseInt(req.params.id, 10);
  const locate = STUB_LOCATES.find(l => l.id === id);

  if (!locate) {
    return res.status(404).json({ error: 'Locate request not found' });
  }

  const { status, assigned_to } = req.body;
  locate.status = status;
  if (assigned_to !== undefined) locate.assigned_to = assigned_to;

  res.json({ updated: true, record: locate });
});

module.exports = router;
