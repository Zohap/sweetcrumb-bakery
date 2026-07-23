const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');

const PAGE_SIZE = 10;

// GET /admin/orders - list with status filter + pagination
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    res.render('admin/orders/list', {
      title: 'Manage Orders',
      orders,
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      status: status || '',
      statuses: Order.STATUSES,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      req.flash('error', 'Order not found.');
      return res.redirect('/admin/orders');
    }
    res.render('admin/orders/details', {
      title: `Order ${order.orderNumber}`,
      order,
      statuses: Order.STATUSES,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/orders/:id/status - update order status
router.post('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!Order.STATUSES.includes(status)) {
      req.flash('error', 'Invalid status.');
      return res.redirect(`/admin/orders/${req.params.id}`);
    }
    await Order.findByIdAndUpdate(req.params.id, { status });
    req.flash('success', 'Order status updated.');
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
