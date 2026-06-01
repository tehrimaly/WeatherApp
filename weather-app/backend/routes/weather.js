const express = require('express');
const router  = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const weatherCtrl = require('../controllers/weatherController');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ── GET current weather (not stored) ─────────────────────────────────
router.get('/current', [
  query('location').notEmpty().withMessage('location query param is required'),
  query('units').optional().isIn(['metric','imperial']).withMessage('units must be metric or imperial'),
], validate, weatherCtrl.getCurrentWeather);

// ── CREATE - POST /api/weather  ────────────────────────────────────────
// Store location + date range query and fetch weather
router.post('/', [
  body('location')
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location too long'),
  body('startDate')
    .notEmpty().withMessage('startDate is required')
    .isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
  body('endDate')
    .notEmpty().withMessage('endDate is required')
    .isISO8601().withMessage('endDate must be a valid ISO 8601 date')
    .custom((val, { req }) => {
      if (new Date(val) < new Date(req.body.startDate)) {
        throw new Error('endDate must be on or after startDate');
      }
      return true;
    }),
  body('units').optional().isIn(['metric','imperial']),
  body('notes').optional().isLength({ max: 1000 }),
  body('tags').optional().isArray(),
], validate, weatherCtrl.createWeatherQuery);

// ── READ - GET /api/weather  ───────────────────────────────────────────
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('city').optional().isString(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('favorite').optional().isBoolean(),
], validate, weatherCtrl.getWeatherQueries);

// READ single
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid record ID'),
], validate, weatherCtrl.getWeatherQueryById);

// ── UPDATE - PUT /api/weather/:id  ────────────────────────────────────
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid record ID'),
  body('location').optional().isLength({ max: 200 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('notes').optional().isLength({ max: 1000 }),
  body('tags').optional().isArray(),
  body('isFavorite').optional().isBoolean(),
], validate, weatherCtrl.updateWeatherQuery);

// ── DELETE - DELETE /api/weather/:id  ─────────────────────────────────
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid record ID'),
], validate, weatherCtrl.deleteWeatherQuery);

// ── DELETE all  ───────────────────────────────────────────────────────
router.delete('/', weatherCtrl.deleteAllWeatherQueries);

module.exports = router;
