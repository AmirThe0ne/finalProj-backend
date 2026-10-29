
const mongoose = require('mongoose');
const Category = require('../models/Category.model');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
      isDeleted: false,
    }).sort({ name: 1 });

    return res.status(200).json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get categories' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name?.trim() || !slug?.trim()) {
      return res.status(400).json({
        message: 'Category name and slug are required',
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const updates = {};

    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }

    if (typeof req.body.slug === 'string' && req.body.slug.trim()) {
      updates.slug = req.body.slug.trim().toLowerCase();
    }

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete category' });
  }
};
