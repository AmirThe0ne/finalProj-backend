
const express = require('express');
const router = express.Router();

const { protect } = require('../middlewares/auth.middleware');

const {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/address.controller');

router.use(protect);

router.get('/', getMyAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

module.exports = router;
