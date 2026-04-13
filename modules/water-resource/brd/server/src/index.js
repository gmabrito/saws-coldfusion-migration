const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { authenticate, loginHandler } = require('./middleware/auth');
const statsRoutes = require('./routes/stats');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'water-resource', timestamp: new Date().toISOString() });
});

// Auth
app.post('/api/auth/login', loginHandler);

// Routes - BRD 7.1: Aquifer stats and water resource data
app.use('/api/stats', statsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SAWS Water Resource API server running on port ${PORT}`);
});
