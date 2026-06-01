require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const weatherRoutes  = require('./routes/weather');
const historyRoutes  = require('./routes/history');
const exportRoutes   = require('./routes/export');
const forecastRoutes = require('./routes/forecast');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

// Global rate limiter — 100 requests per 15 min per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again in 15 minutes.' }
}));

// ─── DB Connection ─────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/weatherapp')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ─── Routes ────────────────────────────────────────────────────────
app.use('/api/weather',  weatherRoutes);
app.use('/api/history',  historyRoutes);
app.use('/api/export',   exportRoutes);
app.use('/api/forecast', forecastRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), author: 'Muhammad Hamza' });
});

// ─── Global Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

app.listen(PORT, () => {
  console.log(`🚀 WeatherSphere backend running on port ${PORT}`);
  console.log(`📋 Author: Muhammad Hamza | PM Accelerator Assessment`);
});

module.exports = app;
