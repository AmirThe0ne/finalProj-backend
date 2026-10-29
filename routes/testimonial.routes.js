const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const controller = require('../controllers/testimonial.controller');

router.get('/admin', protect, adminOnly, controller.getAllTestimonials);
router.patch('/admin/:id', protect, adminOnly, controller.updateTestimonialStatus);
router.get('/', controller.getApprovedTestimonials);
router.post('/', protect, controller.createTestimonial);

module.exports = router;
