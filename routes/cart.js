const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');
const { getCartForUser, calculateCartTotals } = require('../middleware/cartHelper');

// GET /cart - view cart
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const cart = await getCartForUser(req.session.userId);
    const { lines, itemsTotal, itemCount } = calculateCartTotals(cart);
    res.render('cart', {
      title: 'Your Cart',
      lines,
      itemsTotal,
      itemCount,
    });
  } catch (err) {
    next(err);
  }
});

// POST /cart/add - add a product to the cart
router.post('/add', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    let quantity = parseInt(req.body.quantity, 10) || 1;
    if (quantity < 1) quantity = 1;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      req.flash('error', 'That product is not available.');
      return res.redirect('back');
    }

    let cart = await Cart.findOne({ user: req.session.userId });
    if (!cart) {
      cart = new Cart({ user: req.session.userId, items: [] });
    }

    const existingItem = cart.items.find((i) => String(i.product) === String(productId));
    const currentQty = existingItem ? existingItem.quantity : 0;
    const newQty = Math.min(currentQty + quantity, product.stock || 0, 99);

    if (product.stock < 1) {
      req.flash('error', `${product.name} is currently out of stock.`);
      return res.redirect('back');
    }

    if (existingItem) {
      existingItem.quantity = newQty > 0 ? newQty : existingItem.quantity;
    } else {
      cart.items.push({ product: productId, quantity: Math.min(quantity, product.stock) });
    }

    await cart.save();
    req.flash('success', `${product.name} added to your cart.`);
    res.redirect(req.body.redirectTo || '/cart');
  } catch (err) {
    next(err);
  }
});

// POST /cart/update - change quantity of an item
router.post('/update', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    let quantity = parseInt(req.body.quantity, 10) || 1;

    const product = await Product.findById(productId);
    const cart = await Cart.findOne({ user: req.session.userId });
    if (!cart) return res.redirect('/cart');

    const item = cart.items.find((i) => String(i.product) === String(productId));
    if (item) {
      if (quantity < 1) {
        cart.items = cart.items.filter((i) => String(i.product) !== String(productId));
      } else {
        item.quantity = Math.min(quantity, product ? product.stock : quantity, 99);
      }
      await cart.save();
    }
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
});

// POST /cart/remove - remove item from cart
router.post('/remove', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    await Cart.updateOne(
      { user: req.session.userId },
      { $pull: { items: { product: productId } } }
    );
    req.flash('success', 'Item removed from cart.');
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
});

// POST /cart/clear
router.post('/clear', requireAuth, async (req, res, next) => {
  try {
    await Cart.updateOne({ user: req.session.userId }, { $set: { items: [] } });
    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
