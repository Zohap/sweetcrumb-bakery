const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../../middleware/auth');

// Use the dedicated admin layout for every admin view by default.
// The login page explicitly passes { layout: false } which overrides this.
router.use((req, res, next) => {
  res.locals.layout = 'admin/layout';
  next();
});

// Login/logout do not require the admin guard (that's the point of a login page)
router.use('/', require('./auth'));

// Everything below this line requires an authenticated admin
router.use(requireAdmin);

router.use('/', require('./dashboard'));
router.use('/products', require('./products'));
router.use('/categories', require('./categories'));
router.use('/orders', require('./orders'));
router.use('/users', require('./users'));
router.use('/messages', require('./messages'));

module.exports = router;
