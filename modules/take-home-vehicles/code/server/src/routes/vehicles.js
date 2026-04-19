const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ── Stub vehicle inventory ────────────────────────────────────────────────────

const availableVehicles = [
  { id: 1, name: '2023 Ford F-150',       plate: 'F-150-01',  type: 'Pickup',  year: 2023 },
  { id: 2, name: '2022 RAM 1500',          plate: 'R-001',     type: 'Pickup',  year: 2022 },
  { id: 3, name: '2021 Chevy Silverado',   plate: 'S-003',     type: 'Pickup',  year: 2021 },
  { id: 4, name: '2022 Ford Ranger',       plate: 'R-002',     type: 'Compact', year: 2022 },
  { id: 5, name: '2023 Ford F-250',        plate: 'F-250-02',  type: 'Heavy',   year: 2023 },
  { id: 6, name: '2023 Toyota Tacoma',     plate: 'T-001',     type: 'Compact', year: 2023 },
];

/**
 * GET /api/vehicles/available
 * Return vehicles available for checkout tonight.
 */
router.get('/available', (req, res) => {
  res.json(availableVehicles);
});

/**
 * GET /api/vehicles
 * Return full vehicle inventory.
 */
router.get('/', (req, res) => {
  res.json(availableVehicles);
});

module.exports = router;
