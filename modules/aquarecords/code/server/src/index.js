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
app.use('/api/public', require('./routes/public'));
app.use('/api/internal/admin', require('./routes/admin'));
app.use('/api/internal', require('./routes/internal'));

// Health check — includes AquaDocs dependency status
app.get('/api/health', async (req, res) => {
  const aquaDocs = require('./services/aquaDocsService');
  const aquaDocsHealth = await aquaDocs.getServiceHealth();
  res.json({
    status: 'ok',
    module: 'aquarecords',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dependencies: {
      aquadocs: aquaDocsHealth,
    },
  });
});

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

const PORT = process.env.PORT || 3031;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  SAWS AquaRecords API Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  DB:   ${process.env.DB_SERVER || 'localhost'}/${process.env.DB_DATABASE || 'SAWSMigration'}`);
  console.log(`  Env:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`  SMTP: ${process.env.SMTP_HOST ? 'configured' : 'NOT CONFIGURED (stub mode)'}`);
  console.log(`========================================\n`);
});

module.exports = app;
