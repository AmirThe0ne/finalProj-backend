
const express = require('express');
const router = express.Router();

const { protect, adminOnly } = require('../middlewares/auth.middleware');
const {
  getProducts,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductActive,
} = require('../controllers/product.controller');

// Public: visitors can view products
router.get('/', getProducts);

// Admin only: product management
router.get('/admin/all', protect, adminOnly, getAdminProducts);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.patch('/:id/active', protect, adminOnly, setProductActive);

module.exports = router;
