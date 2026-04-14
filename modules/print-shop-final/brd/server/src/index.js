require('dotenv').config();
const express = require('express');
const cors = require('cors');

const jobsRoutes = require('./routes/jobs');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3011;

app.use(cors());
app.use(express.json());

// Auth
app.use('/api/auth', authRoutes);

// Routes
app.use('/api/jobs', jobsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'print-shop-final', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SAWS Print Shop Final API running on port ${PORT}`);
});
