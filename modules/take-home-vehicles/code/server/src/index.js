require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/checkouts', require('./routes/checkouts'));
app.use('/api/vehicles', require('./routes/vehicles'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    module: 'take-home-vehicles',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3041;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  SAWS Take Home Vehicles API Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  DB:   ${process.env.DB_SERVER || 'localhost'}/${process.env.DB_DATABASE || 'SAWSMigration'}`);
  console.log(`  Env:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================\n`);
});

module.exports = app;
