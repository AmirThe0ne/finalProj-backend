const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const { getSummary } = require('../controllers/admin.controller');

router.get('/summary', protect, adminOnly, getSummary);

module.exports = router;
