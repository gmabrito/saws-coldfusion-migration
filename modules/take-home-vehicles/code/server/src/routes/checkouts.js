const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── Stub data ──────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);

let checkouts = [
  {
    id: 1,
    checkout_number: 'THV-2026-001',
    vehicle_id: 1,
    vehicle_name: '2023 Ford F-150',
    vehicle_plate: 'F-150-01',
    employee_name: 'John Smith',
    employee_id: 101,
    purpose: 'after-hours duty',
    checkout_date: today,
    return_date: today,
    status: 'checked-out',
    approved_by: 'Maria Garcia',
    mileage_out: 24310,
    mileage_in: null,
    fuel_out: 'full',
    fuel_in: null,
    notes: 'Covering overnight pump station rounds.',
    _stub: true,
  },
  {
    id: 2,
    checkout_number: 'THV-2026-002',
    vehicle_id: 2,
    vehicle_name: '2022 RAM 1500',
    vehicle_plate: 'R-001',
    employee_name: 'Maria Garcia',
    employee_id: 102,
    purpose: 'on-call',
    checkout_date: today,
    return_date: today,
    status: 'approved',
    approved_by: 'Fleet Manager',
    mileage_out: 18750,
    mileage_in: null,
    fuel_out: '3/4',
    fuel_in: null,
    notes: 'On-call rotation this week.',
    _stub: true,
  },
  {
    id: 3,
    checkout_number: 'THV-2026-003',
    vehicle_id: 3,
    vehicle_name: '2021 Chevy Silverado',
    vehicle_plate: 'S-003',
    employee_name: 'James Wilson',
    employee_id: 103,
    purpose: 'job site',
    checkout_date: today,
    return_date: today,
    status: 'pending',
    approved_by: null,
    mileage_out: null,
    mileage_in: null,
    fuel_out: null,
    fuel_in: null,
    notes: 'Early start at Medina Lake job site.',
    _stub: true,
  },
  {
    id: 4,
    checkout_number: 'THV-2026-004',
    vehicle_id: 5,
    vehicle_name: '2023 Ford F-250',
    vehicle_plate: 'F-250-02',
    employee_name: 'Sarah Chen',
    employee_id: 104,
    purpose: 'emergency response',
    checkout_date: today,
    return_date: today,
    status: 'returned',
    approved_by: 'Maria Garcia',
    mileage_out: 31200,
    mileage_in: 31487,
    fuel_out: 'full',
    fuel_in: '1/2',
    notes: 'Emergency main break on Loop 410.',
    _stub: true,
  },
  {
    id: 5,
    checkout_number: 'THV-2026-005',
    vehicle_id: 4,
    vehicle_name: '2022 Ford Ranger',
    vehicle_plate: 'R-002',
    employee_name: 'Bob Martinez',
    employee_id: 105,
    purpose: 'other',
    checkout_date: today,
    return_date: today,
    status: 'denied',
    approved_by: null,
    mileage_out: null,
    mileage_in: null,
    fuel_out: null,
    fuel_in: null,
    notes: 'Request does not meet take-home policy criteria.',
    _stub: true,
  },
];

let nextId = 6;
let nextSeq = 6;

function padSeq(n) {
  return String(n).padStart(3, '0');
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/checkouts
 * Return all checkouts (optionally filtered by status or employee_id).
 */
router.get('/', (req, res) => {
  let result = [...checkouts];

  if (req.query.status) {
    result = result.filter((c) => c.status === req.query.status);
  }
  if (req.query.employee_id) {
    result = result.filter(
      (c) => String(c.employee_id) === String(req.query.employee_id)
    );
  }

  res.json(result);
});

/**
 * GET /api/checkouts/:id
 * Return a single checkout by id.
 */
router.get('/:id', (req, res) => {
  const record = checkouts.find((c) => c.id === parseInt(req.params.id, 10));
  if (!record) return res.status(404).json({ error: 'Checkout not found' });
  res.json(record);
});

/**
 * POST /api/checkouts
 * Create a new checkout request.
 * Body: { vehicle_id, vehicle_name, vehicle_plate, checkout_date, return_date, purpose, notes }
 */
router.post('/', (req, res) => {
  const { vehicle_id, vehicle_name, vehicle_plate, checkout_date, return_date, purpose, notes } =
    req.body;

  if (!vehicle_id || !checkout_date || !return_date || !purpose) {
    return res
      .status(400)
      .json({ error: 'vehicle_id, checkout_date, return_date, and purpose are required' });
  }

  const year = new Date().getFullYear();
  const record = {
    id: nextId++,
    checkout_number: `THV-${year}-${padSeq(nextSeq++)}`,
    vehicle_id: parseInt(vehicle_id, 10),
    vehicle_name: vehicle_name || `Vehicle ${vehicle_id}`,
    vehicle_plate: vehicle_plate || '',
    employee_name: req.user.name,
    employee_id: req.user.id,
    purpose,
    checkout_date,
    return_date,
    status: 'pending',
    approved_by: null,
    mileage_out: null,
    mileage_in: null,
    fuel_out: null,
    fuel_in: null,
    notes: notes || '',
    _stub: true,
  };

  checkouts.push(record);
  res.status(201).json(record);
});

/**
 * PATCH /api/checkouts/:id/status
 * Transition checkout status.
 * Body: { status, mileage_in?, fuel_in?, approver_notes? }
 *   status options: approved | denied | checkin
 */
router.patch('/:id/status', (req, res) => {
  const record = checkouts.find((c) => c.id === parseInt(req.params.id, 10));
  if (!record) return res.status(404).json({ error: 'Checkout not found' });

  const { status, mileage_in, fuel_in, approver_notes } = req.body;

  if (!status) return res.status(400).json({ error: 'status is required' });

  if (status === 'approved') {
    record.status = 'approved';
    record.approved_by = req.user.name;
  } else if (status === 'denied') {
    record.status = 'denied';
    record.approved_by = req.user.name;
    if (approver_notes) record.notes = approver_notes;
  } else if (status === 'checkin') {
    record.status = 'returned';
    if (mileage_in != null) record.mileage_in = mileage_in;
    if (fuel_in) record.fuel_in = fuel_in;
    if (approver_notes) record.notes = approver_notes;
  } else {
    return res.status(400).json({ error: `Unknown status transition: ${status}` });
  }

  res.json(record);
});

module.exports = router;
