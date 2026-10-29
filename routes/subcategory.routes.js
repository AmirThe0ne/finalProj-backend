
const express = require('express');
const router = express.Router();

const { protect, adminOnly } = require('../middlewares/auth.middleware');
const {
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require('../controllers/subcategory.controller');

router.get('/', getSubcategories);
router.post('/', protect, adminOnly, createSubcategory);
router.put('/:id', protect, adminOnly, updateSubcategory);
router.delete('/:id', protect, adminOnly, deleteSubcategory);

module.exports = router;
