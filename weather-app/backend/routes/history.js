const express = require('express');
const router  = express.Router();

// GET /api/history - alias for GET /api/weather with no filter
// Useful as a dedicated "view history" endpoint
router.get('/', async (req, res, next) => {
  try {
    const WeatherQuery = require('../models/WeatherQuery');
    const { page = 1, limit = 10 } = req.query;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await WeatherQuery.countDocuments();
    const records = await WeatherQuery.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    res.json({
      data: records,
      pagination: {
        total, page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
