
const express = require('express');
const router = express.Router();

const {
  protect,
  adminOnly,
} = require('../middlewares/auth.middleware');

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelMyOrder,
} = require('../controllers/order.controller');

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.patch('/:id/cancel', protect, cancelMyOrder);

router.get('/admin/all', protect, adminOnly, getAllOrders);
router.patch('/admin/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
