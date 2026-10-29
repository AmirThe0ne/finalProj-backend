
const mongoose = require('mongoose');
const Product = require('../models/Product.model');

const allowedFields = [
  'title',
  'description',
  'price',
  'stock',
  'category',
  'categoryId',
  'subcategoryId',
  'imageUrl',
  'slug',
  'isActive',
];

exports.getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    const filter = {
      isActive: { $ne: false },
      isDeleted: { $ne: true },
    };

    if (search && search.trim()) {
      const searchText = search.trim();
      filter.$or = [
        { title: { $regex: searchText, $options: 'i' } },
        { description: { $regex: searchText, $options: 'i' } },
      ];
    }

    if (category && category.trim()) {
      filter.category = category.trim();
    }

    let sortOption = {};

    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const products = await Product.find(filter).sort(sortOption);
    return res.status(200).json(products);
  } catch (error) {
    console.error('Failed to get products:', error);
    return res.status(500).json({ message: 'Failed to get products' });
  }
};

exports.getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get products' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) productData[field] = req.body[field];
    }

    const product = await Product.create(productData);
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true, isActive: false } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({
      message: 'Product deleted successfully',
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete product' });
  }
};

exports.setProductActive = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive must be true or false',
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: { isActive } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({
      message: isActive ? 'Product activated' : 'Product hidden',
      product,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to change product visibility' });
  }
};
