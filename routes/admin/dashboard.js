const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const User = require('../../models/User');
const ContactMessage = require('../../models/ContactMessage');

router.get('/', async (req, res, next) => {
  try {
    const [
      totalProducts,
      lowStockCount,
      totalOrders,
      pendingOrders,
      totalCustomers,
      unreadMessages,
      recentOrders,
      revenueAgg,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'customer' }),
      ContactMessage.countDocuments({ isRead: false }),
      Order.find().sort({ createdAt: -1 }).limit(6).populate('user', 'name email'),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
    ]);

    const topProducts = await Product.find({ isActive: true })
      .sort({ ratingAverage: -1, ratingCount: -1 })
      .limit(5);

    res.render('admin/dashboard', {
      title: 'Dashboard',
      stats: {
        totalProducts,
        lowStockCount,
        totalOrders,
        pendingOrders,
        totalCustomers,
        unreadMessages,
        totalRevenue: revenueAgg.length ? revenueAgg[0].total : 0,
      },
      recentOrders,
      topProducts,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
