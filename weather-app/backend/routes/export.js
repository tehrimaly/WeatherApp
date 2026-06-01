const express = require('express');
const router  = express.Router();
const exportCtrl = require('../controllers/exportController');

// GET /api/export?format=json|csv|xml|pdf|markdown
router.get('/', exportCtrl.exportData);

module.exports = router;
