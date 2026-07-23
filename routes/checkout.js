const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { getCartForUser, calculateCartTotals } = require('../middleware/cartHelper');

const SHIPPING_FEE = 200;
const FREE_SHIPPING_THRESHOLD = 3000;

function generateOrderNumber() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SCB-${Date.now().toString().slice(-6)}${rand}`;
}

// GET /checkout
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const cart = await getCartForUser(req.session.userId);
    if (!cart.items.length) {
      req.flash('error', 'Your cart is empty. Add some treats first!');
      return res.redirect('/products');
    }
    const { lines, itemsTotal } = calculateCartTotals(cart);
    const shippingFee = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const user = await User.findById(req.session.userId).lean();

    res.render('checkout', {
      title: 'Checkout',
      lines,
      itemsTotal,
      shippingFee,
      grandTotal: itemsTotal + shippingFee,
      user,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
});

// POST /checkout - place the order
router.post(
  '/',
  requireAuth,
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('line1').trim().notEmpty().withMessage('Delivery address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('paymentMethod').isIn(['cod', 'card']).withMessage('Choose a valid payment method'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    try {
      const cart = await getCartForUser(req.session.userId);
      if (!cart.items.length) {
        req.flash('error', 'Your cart is empty.');
        return res.redirect('/products');
      }
      const { lines, itemsTotal } = calculateCartTotals(cart);
      const shippingFee = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

      if (!errors.isEmpty()) {
        return res.render('checkout', {
          title: 'Checkout',
          lines,
          itemsTotal,
          shippingFee,
          grandTotal: itemsTotal + shippingFee,
          user: req.body,
          errors: errors.array(),
        });
      }

      // Re-validate stock right before placing the order
      for (const line of lines) {
        if (line.quantity > line.product.stock) {
          req.flash('error', `Sorry, only ${line.product.stock} of ${line.product.name} left in stock.`);
          return res.redirect('/cart');
        }
      }

      const { fullName, phone, line1, city, postalCode, paymentMethod, notes } = req.body;

      const order = await Order.create({
        orderNumber: generateOrderNumber(),
        user: req.session.userId,
        items: lines.map((l) => ({
          product: l.product._id,
          name: l.product.name,
          image: l.product.image,
          price: l.unitPrice,
          quantity: l.quantity,
        })),
        shipping: { fullName, phone, line1, city, postalCode },
        paymentMethod,
        itemsTotal,
        shippingFee,
        grandTotal: itemsTotal + shippingFee,
        notes: notes || '',
      });

      // Decrement stock for each purchased product
      for (const line of lines) {
        line.product.stock = Math.max(line.product.stock - line.quantity, 0);
        await line.product.save();
      }

      // Persist shipping address to profile for next time & clear cart
      await User.findByIdAndUpdate(req.session.userId, {
        address: { fullName, phone, line1, city, postalCode },
      });
      await Cart.updateOne({ user: req.session.userId }, { $set: { items: [] } });

      res.redirect(`/orders/${order._id}?placed=1`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
