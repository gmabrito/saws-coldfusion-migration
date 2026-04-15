require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { instrumentation } = require('./middleware/instrumentation');
const eventBus = require('./events/eventBus');
const EventRepository = require('./repositories/eventRepository');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(instrumentation);

// Wire event repository after DB is ready
const eventRepo = new EventRepository();
eventBus.setRepository(eventRepo);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/meters', require('./routes/meters'));
app.use('/api/readings', require('./routes/readings'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/rates', require('./routes/rates'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    module: 'flat-rate-sewer',
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

const PORT = process.env.PORT || 3020;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  SAWS FRS API Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  DB:   ${process.env.DB_SERVER || 'localhost'}/${process.env.DB_DATABASE || 'SAWSMigration'}`);
  console.log(`  Env:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================\n`);
});

module.exports = app;
