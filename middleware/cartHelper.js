const Cart = require('../models/Cart');

// Fetches (or creates) the cart for a logged-in user, with products populated,
// and strips out any items whose product was deleted or deactivated.
async function getCartForUser(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.product && i.product.isActive);
  if (cart.items.length !== before) {
    await cart.save();
  }
  return cart;
}

function calculateCartTotals(cart) {
  let itemsTotal = 0;
  let itemCount = 0;
  const lines = cart.items.map((item) => {
    const unitPrice = item.product.discountPrice > 0 ? item.product.discountPrice : item.product.price;
    const lineTotal = unitPrice * item.quantity;
    itemsTotal += lineTotal;
    itemCount += item.quantity;
    return {
      product: item.product,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    };
  });
  return { lines, itemsTotal, itemCount };
}

// Middleware: attaches res.locals.cartItemCount for the navbar badge on every page
async function attachCartCount(req, res, next) {
  res.locals.cartItemCount = 0;
  if (req.session && req.session.userId) {
    try {
      const cart = await Cart.findOne({ user: req.session.userId });
      if (cart) {
        res.locals.cartItemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      }
    } catch (err) {
      // ignore
    }
  }
  next();
}

module.exports = { getCartForUser, calculateCartTotals, attachCartCount };
