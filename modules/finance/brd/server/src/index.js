require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const contractsRoutes = require('./routes/contracts');
const readingsRoutes = require('./routes/readings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/readings', readingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', module: 'finance', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SAWS Finance API running on port ${PORT}`);
});
