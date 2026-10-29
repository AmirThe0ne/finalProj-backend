
const mongoose = require('mongoose');
const Address = require('../models/Address.model');

exports.getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      user: req.user.userId,
    }).sort({ isDefault: -1, createdAt: -1 });

    return res.status(200).json(addresses);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get addresses' });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const { title, address, mobile, isDefault } = req.body;

    if (
      typeof title !== 'string' || !title.trim() ||
      typeof address !== 'string' || !address.trim() ||
      typeof mobile !== 'string' || !mobile.trim()
    ) {
      return res.status(400).json({
        message: 'Title, address and mobile are required',
      });
    }

    const shouldBeDefault = isDefault === true;
    const hasDefault = await Address.exists({
      user: req.user.userId,
      isDefault: true,
    });

    if (shouldBeDefault || !hasDefault) {
      await Address.updateMany(
        { user: req.user.userId },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = await Address.create({
      user: req.user.userId,
      title: title.trim(),
      address: address.trim(),
      mobile: mobile.trim(),
      isDefault: shouldBeDefault || !hasDefault,
    });

    return res.status(201).json(newAddress);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const updates = {};
    for (const field of ['title', 'address', 'mobile']) {
      if (req.body[field] !== undefined) {
        if (
          typeof req.body[field] !== 'string' ||
          !req.body[field].trim()
        ) {
          return res.status(400).json({
            message: `${field} must not be empty`,
          });
        }
        updates[field] = req.body[field].trim();
      }
    }

    if (req.body.isDefault === true) {
      await Address.updateMany(
        { user: req.user.userId },
        { $set: { isDefault: false } }
      );
      updates.isDefault = true;
    } else if (req.body.isDefault === false) {
      updates.isDefault = false;
    }

    const updated = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Address not found' });
    }

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const deleted = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Address not found' });
    }

    if (deleted.isDefault) {
      const nextAddress = await Address.findOne({
        user: req.user.userId,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete address' });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await Address.updateMany(
      { user: req.user.userId },
      { $set: { isDefault: false } }
    );

    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      message: 'Default address updated',
      address,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to set default address',
    });
  }
};
