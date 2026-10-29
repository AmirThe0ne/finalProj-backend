
const mongoose = require('mongoose');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');

// Create a new order using current database prices and stock.
exports.createOrder = async (req, res) => {
  const { items, address, mobile } = req.body;

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    typeof address !== 'string' ||
    !address.trim() ||
    typeof mobile !== 'string' ||
    !mobile.trim()
  ) {
    return res.status(400).json({
      message: 'Items, address and mobile are required',
    });
  }

  const quantities = new Map();
  const expectedPrices = new Map();

  for (const item of items) {
    if (
      !item ||
      !item.product ||
      !mongoose.isValidObjectId(item.product) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      typeof item.expectedPrice !== 'number' ||
      !Number.isFinite(item.expectedPrice) ||
      item.expectedPrice < 0
    ) {
      return res.status(400).json({
        message: 'Each item needs a valid product ID, quantity and expected price',
      });
    }

    const productId = item.product.toString();

    if (
      expectedPrices.has(productId) &&
      expectedPrices.get(productId) !== item.expectedPrice
    ) {
      return res.status(400).json({
        message: 'Conflicting prices for the same product',
        productId,
      });
    }

    quantities.set(
      productId,
      (quantities.get(productId) || 0) + item.quantity
    );

    expectedPrices.set(productId, item.expectedPrice);
  }

  const reserved = [];
  let orderCreated = false;

  const restoreStock = async () => {
    for (const entry of reserved) {
      try {
        await Product.updateOne(
          { _id: entry.productId },
          { $inc: { stock: entry.quantity } }
        );
      } catch (restoreError) {
        console.error(
          'Failed to restore product stock:',
          entry.productId,
          restoreError
        );
      }
    }

    reserved.length = 0;
  };

  try {
    const orderItems = [];
    let totalPrice = 0;

    for (const [productId, quantity] of quantities) {
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          isActive: { $ne: false },
          isDeleted: { $ne: true },
          stock: { $gte: quantity },
        },
        {
          $inc: { stock: -quantity },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!product) {
        await restoreStock();

        return res.status(400).json({
          message: 'A product is unavailable or has insufficient stock',
          productId,
        });
      }

      reserved.push({ productId, quantity });

      const expectedPrice = expectedPrices.get(productId);

      if (product.price !== expectedPrice) {
        await restoreStock();

        return res.status(409).json({
          message: 'Product price changed. Please review your cart.',
          productId,
          currentPrice: product.price,
        });
      }

      orderItems.push({
        product: product._id,
        quantity,
        price: product.price,
        titleSnapshot: product.title,
      });

      totalPrice += product.price * quantity;
    }

    const order = await Order.create({
      user: req.user.userId,
      items: orderItems,
      addressSnapshot: address.trim(),
      mobileSnapshot: mobile.trim(),
      totalPrice,
      status: 'pending',
    });

    orderCreated = true;

    return res.status(201).json({
      message: 'Order created successfully. Payment method: Cash on Delivery',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);

    if (!orderCreated) {
      await restoreStock();
    }

    return res.status(500).json({
      message: 'Failed to create order',
    });
  }
};

// Get the logged-in customer's orders.
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);

    return res.status(500).json({
      message: 'Failed to get orders',
    });
  }
};

// Get all orders (admin only).
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);

    return res.status(500).json({
      message: 'Failed to get all orders',
    });
  }
};

// Update order status (admin only).
exports.updateOrderStatus = async (req, res) => {
  try {
    const allowedStatuses = [
      'pending', 'preparing', 'shipped', 'delivered', 'received',
      'cancelled by admin', 'cancelled by client', 'rejected', 'refunded',
    ];
    const restockStatuses = new Set([
      'cancelled by admin', 'cancelled by client', 'rejected', 'refunded',
    ]);
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    let shouldRestock = false;
    if (restockStatuses.has(status) && !order.stockRestocked) {
      const claimed = await Order.findOneAndUpdate(
        { _id: order._id, stockRestocked: false },
        { $set: { stockRestocked: true } },
        { new: true }
      );
      shouldRestock = Boolean(claimed);
      order = claimed || order;
    }

    if (shouldRestock) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ message: 'Failed to update order status' });
  }
};

exports.cancelMyOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
        status: 'pending',
        stockRestocked: false,
      },
      { $set: { status: 'cancelled by client', stockRestocked: true } },
      { new: true }
    );

    if (!order) {
      return res.status(400).json({
        message: 'Only pending orders that have not been restocked can be cancelled',
      });
    }

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );
    }

    return res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ message: 'Failed to cancel order' });
  }
};
