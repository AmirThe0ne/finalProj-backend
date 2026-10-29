const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/admin/users', protect, adminOnly, authController.getAdminUsers);
router.patch('/admin/users/:id/block', protect, adminOnly, authController.toggleUserBlock);
router.post('/admin/create-admin', protect, adminOnly, authController.createAdmin);

module.exports = router;