const express = require('express');
const router  = express.Router();
const { query, validationResult } = require('express-validator');
const { resolveLocation, fetchWeatherForDateRange } = require('../config/weatherService');

// GET /api/forecast?location=...&startDate=...&endDate=...&units=metric
router.get('/', [
  query('location').notEmpty().withMessage('location is required'),
  query('units').optional().isIn(['metric','imperial']),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { location, startDate, endDate, units = 'metric' } = req.query;

    const resolved = await resolveLocation(location);
    if (!resolved) {
      return res.status(404).json({ error: `Location "${location}" not found.` });
    }

    const forecast = await fetchWeatherForDateRange(
      resolved.lat, resolved.lon,
      startDate || new Date().toISOString(),
      endDate   || new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
      units
    );

    res.json({ resolved, forecast });
  } catch (err) { next(err); }
});

module.exports = router;
