const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ContactMessage = require('../models/ContactMessage');
const Order = require('../models/Order');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// GET / - Home page
router.get('/', async (req, res, next) => {
  try {
    const [featured, categories, newest] = await Promise.all([
      Product.find({ isActive: true, isFeatured: true }).populate('category').limit(8),
      Category.find({ isActive: true }).limit(6),
      Product.find({ isActive: true }).sort({ createdAt: -1 }).populate('category').limit(8),
    ]);

    res.render('index', {
      title: 'Sweet Crumb Artisan Bakery - Freshly Baked, Delivered Daily',
      featured,
      categories,
      newest,
    });
  } catch (err) {
    next(err);
  }
});

// GET /about
router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

// GET /contact
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us', formData: {}, errors: [], sent: false });
});

// POST /contact
router.post(
  '/contact',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('A valid email is required'),
    body('message').trim().isLength({ min: 5 }).withMessage('Message is too short'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const { name, email, subject, message } = req.body;

    if (!errors.isEmpty()) {
      return res.render('contact', {
        title: 'Contact Us',
        formData: { name, email, subject, message },
        errors: errors.array(),
        sent: false,
      });
    }

    try {
      await ContactMessage.create({ name, email, subject, message });
      res.render('contact', {
        title: 'Contact Us',
        formData: {},
        errors: [],
        sent: true,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /account - profile + order history summary
router.get('/account', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId).lean();
    const recentOrders = await Order.find({ user: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(5);
    res.render('account', {
      title: 'My Account',
      user,
      recentOrders,
      errors: [],
      success: null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /account - update profile details
router.post(
  '/account',
  requireAuth,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    const { name, phone, fullName, addrPhone, line1, city, postalCode } = req.body;

    try {
      const user = await User.findById(req.session.userId);
      if (!errors.isEmpty()) {
        const recentOrders = await Order.find({ user: req.session.userId })
          .sort({ createdAt: -1 })
          .limit(5);
        return res.render('account', {
          title: 'My Account',
          user: { ...user.toObject(), name, phone },
          recentOrders,
          errors: errors.array(),
          success: null,
        });
      }

      user.name = name;
      user.phone = phone || '';
      user.address = {
        fullName: fullName || '',
        phone: addrPhone || '',
        line1: line1 || '',
        city: city || '',
        postalCode: postalCode || '',
      };
      await user.save();
      req.flash('success', 'Your profile has been updated.');
      res.redirect('/account');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
