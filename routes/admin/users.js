const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Order = require('../../models/Order');

const PAGE_SIZE = 10;

// GET /admin/users - customers list
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const { q } = req.query;
    const filter = { role: 'customer' };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    const orderCounts = await Order.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 }, spent: { $sum: '$grandTotal' } } },
    ]);
    const map = {};
    orderCounts.forEach((o) => { map[o._id] = o; });
    users.forEach((u) => {
      u.orderCount = map[u._id] ? map[u._id].count : 0;
      u.totalSpent = map[u._id] ? map[u._id].spent : 0;
    });

    res.render('admin/users/list', {
      title: 'Manage Customers',
      users,
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      q: q || '',
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/users/:id/toggle-block
router.post('/:id/toggle-block', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') {
      req.flash('error', 'Cannot modify this user.');
      return res.redirect('/admin/users');
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    req.flash('success', `${user.name} has been ${user.isBlocked ? 'blocked' : 'unblocked'}.`);
    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
