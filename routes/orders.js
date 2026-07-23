const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');

// GET /orders - order history for the logged-in customer
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.session.userId }).sort({ createdAt: -1 });
    res.render('orders/list', { title: 'My Orders', orders });
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id - single order details (only the owner can view)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.session.userId });
    if (!order) {
      return res.status(404).render('404', { title: 'Order Not Found' });
    }
    res.render('orders/details', {
      title: `Order ${order.orderNumber}`,
      order,
      justPlaced: req.query.placed === '1',
    });
  } catch (err) {
    next(err);
  }
});

// POST /orders/:id/cancel - customer can cancel while still pending
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.session.userId });
    if (!order) {
      return res.status(404).render('404', { title: 'Order Not Found' });
    }
    if (order.status !== 'pending') {
      req.flash('error', 'This order can no longer be cancelled.');
      return res.redirect(`/orders/${order._id}`);
    }
    order.status = 'cancelled';
    await order.save();
    req.flash('success', 'Your order has been cancelled.');
    res.redirect(`/orders/${order._id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
