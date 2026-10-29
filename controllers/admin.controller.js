const Order = require('../models/Order.model');
const Product = require('../models/Product.model');

exports.getSummary = async (req, res) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [pendingOrders, newOrdersLast24h, lowStockProducts, outOfStockCount] = await Promise.all([
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ createdAt: { $gte: since24h } }),
      Product.find({ stock: { $lte: 5 }, isDeleted: { $ne: true } })
        .select('_id title stock')
        .sort({ stock: 1 }),
      Product.countDocuments({ stock: { $lte: 0 }, isDeleted: { $ne: true } }),
    ]);

    return res.status(200).json({
      pendingOrders,
      newOrdersLast24h,
      lowStockProducts,
      outOfStockCount,
    });
  } catch (error) {
    console.error('Failed to get admin summary:', error);
    return res.status(500).json({ message: 'Failed to get admin summary' });
  }
};
