require('dotenv').config();
const express = require('express');
const cors = require('cors');

const mapsRoutes = require('./routes/maps');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3013;

app.use(cors());
app.use(express.json());

// Auth
app.use('/api/auth', authRoutes);

// Routes
app.use('/api/maps', mapsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'utility-maps', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SAWS Utility Maps API running on port ${PORT}`);
});
