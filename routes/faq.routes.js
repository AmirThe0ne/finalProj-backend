const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/auth.middleware');
const controller = require('../controllers/faq.controller');

router.get('/', controller.getFaqs);
router.post('/', protect, adminOnly, controller.createFaq);
router.put('/:id', protect, adminOnly, controller.updateFaq);
router.delete('/:id', protect, adminOnly, controller.deleteFaq);

module.exports = router;
