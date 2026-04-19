const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// All SITREP routes require authentication
router.use(authenticate);

// ── Stub data ────────────────────────────────────────────────────────────────

const now = new Date().toISOString();
const d = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
};

let stubSitreps = [
  {
    id: 1,
    sitrep_number: 'SITREP-2026-001',
    facility: 'North Loop Pump Station',
    type: 'Water Main Break',
    severity: 'Critical',
    status: 'active',
    location_detail: 'Main feed line at valve junction 7B',
    description:
      'Major water main break discovered at the North Loop Pump Station. Flow reduced to 40% capacity. Crews dispatched. Traffic control requested for surrounding roads.',
    created_by: 'J. Martinez',
    assigned_to: 'Operations Team Alpha',
    created_at: d(0),
    updated_at: d(0),
    notify_teams: ['Operations', 'EOC', 'Executive'],
    response_log: [
      { timestamp: d(0), actor: 'J. Martinez', action: 'SITREP created', note: 'Initial report filed' },
      { timestamp: d(0), actor: 'EOC Duty Officer', action: 'Acknowledged', note: 'Operations Team Alpha dispatched' },
    ],
    _stub: true,
  },
  {
    id: 2,
    sitrep_number: 'SITREP-2026-002',
    facility: 'Elmendorf Treatment Plant',
    type: 'Power Outage',
    severity: 'High',
    status: 'monitoring',
    location_detail: 'Primary electrical substation, building C',
    description:
      'Complete power loss at Elmendorf Treatment Plant. Backup generators online. CPS Energy notified. Estimated restoration 4 hours.',
    created_by: 'R. Flores',
    assigned_to: 'Facilities & IT',
    created_at: d(1),
    updated_at: d(0),
    notify_teams: ['Operations', 'EOC', 'IT'],
    response_log: [
      { timestamp: d(1), actor: 'R. Flores', action: 'SITREP created', note: 'Power failure detected' },
      { timestamp: d(1), actor: 'IT On-Call', action: 'Generators confirmed online', note: 'SCADA running on backup power' },
      { timestamp: d(0), actor: 'R. Flores', action: 'Status → monitoring', note: 'CPS Energy ETA confirmed 4 hrs' },
    ],
    _stub: true,
  },
  {
    id: 3,
    sitrep_number: 'SITREP-2026-003',
    facility: 'Metrocom Pump Station',
    type: 'Equipment Failure',
    severity: 'Medium',
    status: 'resolved',
    location_detail: 'Pump unit 3, motor bearing assembly',
    description:
      'Pump unit 3 failed due to bearing failure. Station operating on remaining units at reduced capacity. Repair parts ordered.',
    created_by: 'A. Nguyen',
    assigned_to: 'Maintenance Crew B',
    created_at: d(3),
    updated_at: d(2),
    notify_teams: ['Operations'],
    response_log: [
      { timestamp: d(3), actor: 'A. Nguyen', action: 'SITREP created', note: 'Bearing failure confirmed by inspection' },
      { timestamp: d(2), actor: 'Maintenance Crew B', action: 'Parts replaced', note: 'Pump unit 3 restored to service' },
      { timestamp: d(2), actor: 'A. Nguyen', action: 'Status → resolved', note: 'Station back to full capacity' },
    ],
    _stub: true,
  },
  {
    id: 4,
    sitrep_number: 'SITREP-2026-004',
    facility: 'Main Office',
    type: 'Security Incident',
    severity: 'Low',
    status: 'resolved',
    location_detail: 'Parking garage, Level 2, northeast stairwell',
    description:
      'Unauthorized individual found in parking garage. SAPD contacted. Individual escorted off property. No damage or theft reported.',
    created_by: 'T. Brown',
    assigned_to: 'Security',
    created_at: d(5),
    updated_at: d(5),
    notify_teams: ['EOC'],
    response_log: [
      { timestamp: d(5), actor: 'T. Brown', action: 'SITREP created', note: 'Security guard reported unauthorized access' },
      { timestamp: d(5), actor: 'Security', action: 'SAPD notified', note: 'Officer responded within 10 minutes' },
      { timestamp: d(5), actor: 'T. Brown', action: 'Status → resolved', note: 'Individual removed, no further action required' },
    ],
    _stub: true,
  },
];

let nextId = 5;
let nextNumber = 5;

// ── Helper ───────────────────────────────────────────────────────────────────

function padded(n) {
  return String(n).padStart(3, '0');
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/sitreps
 * List all SITREPs.
 */
router.get('/', (req, res) => {
  res.json(stubSitreps);
});

/**
 * POST /api/sitreps
 * Create a new SITREP.
 */
router.post('/', (req, res) => {
  const year = new Date().getFullYear();
  const sitrep = {
    id: nextId++,
    sitrep_number: `SITREP-${year}-${padded(nextNumber++)}`,
    facility: req.body.facility || '',
    type: req.body.type || '',
    severity: req.body.severity || 'Medium',
    status: 'active',
    location_detail: req.body.location_detail || '',
    description: req.body.description || '',
    created_by: req.user?.name || 'Unknown',
    assigned_to: req.body.assigned_to || 'EOC Duty Officer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notify_teams: req.body.notify_teams || [],
    response_log: [
      {
        timestamp: new Date().toISOString(),
        actor: req.user?.name || 'Unknown',
        action: 'SITREP created',
        note: 'Initial report filed',
      },
    ],
    _stub: true,
  };
  stubSitreps.unshift(sitrep);
  res.status(201).json(sitrep);
});

/**
 * GET /api/sitreps/:id
 * Get a single SITREP with full response log.
 */
router.get('/:id', (req, res) => {
  const sitrep = stubSitreps.find((s) => s.id === parseInt(req.params.id, 10));
  if (!sitrep) {
    return res.status(404).json({ error: 'SITREP not found' });
  }
  res.json(sitrep);
});

/**
 * PATCH /api/sitreps/:id/status
 * Update status and append to response log.
 */
router.patch('/:id/status', (req, res) => {
  const sitrep = stubSitreps.find((s) => s.id === parseInt(req.params.id, 10));
  if (!sitrep) {
    return res.status(404).json({ error: 'SITREP not found' });
  }

  const { status, note } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const prevStatus = sitrep.status;
  sitrep.status = status;
  sitrep.updated_at = new Date().toISOString();
  sitrep.response_log.push({
    timestamp: new Date().toISOString(),
    actor: req.user?.name || 'Unknown',
    action: `Status: ${prevStatus} → ${status}`,
    note: note || '',
  });

  res.json(sitrep);
});

module.exports = router;
