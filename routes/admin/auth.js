const express = require('express');
const router = express.Router();
const User = require('../../models/User');

// GET /admin/login
router.get('/login', (req, res) => {
  if (res.locals.currentUser && res.locals.currentUser.role === 'admin') {
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Admin Login', layout: false, errors: [], email: '' });
});

// POST /admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin' || !(await user.comparePassword(password))) {
      return res.render('admin/login', {
        title: 'Admin Login',
        layout: false,
        errors: [{ msg: 'Invalid admin credentials.' }],
        email,
      });
    }
    req.session.userId = user._id;
    res.redirect('/admin');
  } catch (err) {
    res.render('admin/login', {
      title: 'Admin Login',
      layout: false,
      errors: [{ msg: 'Something went wrong. Please try again.' }],
      email,
    });
  }
});

// POST /admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

module.exports = router;
