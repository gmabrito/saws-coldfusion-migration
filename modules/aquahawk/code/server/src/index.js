require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { instrumentation } = require('./middleware/instrumentation');
const eventBus = require('./events/eventBus');
const EventRepository = require('./repositories/eventRepository');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(instrumentation);

const eventRepo = new EventRepository();
eventBus.setRepository(eventRepo);

// NOTE: admin before internal to prevent route conflicts
app.use('/api/internal/admin', require('./routes/admin'));
app.use('/api/internal/costs', require('./routes/costs'));
app.use('/api/internal', require('./routes/internal'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'aquahawk', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl }));
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3032;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  SAWS AquaHawk API Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Env:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`========================================\n`);
});

module.exports = app;
