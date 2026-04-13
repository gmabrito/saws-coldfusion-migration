const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { authenticate, loginHandler } = require('./middleware/auth');
const transmittalRoutes = require('./routes/transmittals');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'records', timestamp: new Date().toISOString() });
});

// Auth
app.post('/api/auth/login', loginHandler);

// Routes - retention-codes must be before transmittals to avoid /:id conflict
app.use('/api/retention-codes', (() => {
  const router = express.Router();
  const { sql, getPool } = require('./config/database');

  router.get('/', authenticate, async (req, res) => {
    try {
      const pool = await getPool();
      const result = await pool.request()
        .execute('records.usp_GetRetentionCodes');
      res.json({ data: result.recordset });
    } catch (err) {
      console.error('Error fetching retention codes:', err);
      res.status(500).json({ error: 'Failed to fetch retention codes.' });
    }
  });

  return router;
})());

// Transmittal routes
app.use('/api/transmittals', transmittalRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SAWS Records API server running on port ${PORT}`);
});
