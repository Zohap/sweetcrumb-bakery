const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { redirectIfAuthenticated } = require('../middleware/auth');

// GET /register
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('auth/register', {
    title: 'Create an Account',
    formData: {},
    errors: [],
  });
});

// POST /register
router.post(
  '/register',
  redirectIfAuthenticated,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    body('phone').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { name, email, password, phone } = req.body;

    if (!errors.isEmpty()) {
      return res.render('auth/register', {
        title: 'Create an Account',
        formData: { name, email, phone },
        errors: errors.array(),
      });
    }

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.render('auth/register', {
          title: 'Create an Account',
          formData: { name, email, phone },
          errors: [{ msg: 'An account with this email already exists.' }],
        });
      }

      const user = await User.create({ name, email, password, phone });
      req.session.userId = user._id;
      req.flash('success', `Welcome to Sweet Crumb, ${user.name}!`);
      res.redirect('/');
    } catch (err) {
      console.error(err);
      res.render('auth/register', {
        title: 'Create an Account',
        formData: { name, email, phone },
        errors: [{ msg: 'Something went wrong. Please try again.' }],
      });
    }
  }
);

// GET /login
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', {
    title: 'Log In',
    formData: {},
    errors: [],
    redirectTo: req.query.redirect || '',
  });
});

// POST /login
router.post(
  '/login',
  redirectIfAuthenticated,
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const { email, password, redirectTo } = req.body;

    if (!errors.isEmpty()) {
      return res.render('auth/login', {
        title: 'Log In',
        formData: { email },
        errors: errors.array(),
        redirectTo,
      });
    }

    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.render('auth/login', {
          title: 'Log In',
          formData: { email },
          errors: [{ msg: 'Incorrect email or password.' }],
          redirectTo,
        });
      }
      if (user.isBlocked) {
        return res.render('auth/login', {
          title: 'Log In',
          formData: { email },
          errors: [{ msg: 'This account has been blocked. Please contact support.' }],
          redirectTo,
        });
      }

      req.session.userId = user._id;
      req.flash('success', `Welcome back, ${user.name}!`);

      if (redirectTo && redirectTo.startsWith('/')) {
        return res.redirect(redirectTo);
      }
      res.redirect('/');
    } catch (err) {
      console.error(err);
      res.render('auth/login', {
        title: 'Log In',
        formData: { email },
        errors: [{ msg: 'Something went wrong. Please try again.' }],
        redirectTo,
      });
    }
  }
);

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
