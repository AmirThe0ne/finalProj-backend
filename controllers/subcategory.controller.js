
const mongoose = require('mongoose');
const Category = require('../models/Category.model');
const Subcategory = require('../models/Subcategory.model');

exports.getSubcategories = async (req, res) => {
  try {
    const filter = {
      isActive: true,
      isDeleted: false,
    };

    if (req.query.category) {
      if (!mongoose.isValidObjectId(req.query.category)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      filter.category = req.query.category;
    }

    const subcategories = await Subcategory.find(filter)
      .populate('category', 'name slug')
      .sort({ name: 1 });

    return res.status(200).json(subcategories);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to get subcategories',
    });
  }
};

exports.createSubcategory = async (req, res) => {
  try {
    const { name, slug, category } = req.body;

    if (!name?.trim() || !slug?.trim() || !category) {
      return res.status(400).json({
        message: 'Name, slug and category are required',
      });
    }

    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const parent = await Category.findOne({
      _id: category,
      isActive: true,
      isDeleted: false,
    });

    if (!parent) {
      return res.status(400).json({
        message: 'Active category not found',
      });
    }

    const subcategory = await Subcategory.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      category,
    });

    return res.status(201).json(subcategory);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid subcategory ID' });
    }

    const updates = {};

    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }

    if (typeof req.body.slug === 'string' && req.body.slug.trim()) {
      updates.slug = req.body.slug.trim().toLowerCase();
    }

    if (req.body.category !== undefined) {
      if (!mongoose.isValidObjectId(req.body.category)) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }

      const parent = await Category.findOne({
        _id: req.body.category,
        isActive: true,
        isDeleted: false,
      });

      if (!parent) {
        return res.status(400).json({
          message: 'Active category not found',
        });
      }

      updates.category = req.body.category;
    }

    const subcategory = await Subcategory.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    return res.status(200).json(subcategory);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid subcategory ID' });
    }

    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    return res.status(200).json({
      message: 'Subcategory deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete subcategory',
    });
  }
};
