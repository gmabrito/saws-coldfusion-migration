require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Core middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', require('./routes/locates'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    module: 'locates',
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

const PORT = process.env.PORT || 3042;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  SAWS Locates API Server`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Env:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Public routes: POST /api/locates, POST /api/auth/login`);
  console.log(`  Staff routes:  GET /api/locates, PATCH /api/locates/:id`);
  console.log(`========================================\n`);
});

module.exports = app;
