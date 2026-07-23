const User = require('../models/User');

// Loads the logged-in user (if any) into res.locals for use in all views
async function loadUser(req, res, next) {
  res.locals.currentUser = null;
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).lean();
      if (user && !user.isBlocked) {
        res.locals.currentUser = user;
      } else {
        req.session.userId = null;
      }
    } catch (err) {
      // invalid id etc. - ignore, treat as logged out
    }
  }
  next();
}

// Require any logged-in user (customer or admin)
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    req.flash('error', 'Please log in to continue.');
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
}

// Require an admin account; used for every /admin route except /admin/login
function requireAdmin(req, res, next) {
  if (!res.locals.currentUser || res.locals.currentUser.role !== 'admin') {
    req.flash('error', 'Please log in as an administrator to access this page.');
    return res.redirect('/admin/login');
  }
  next();
}

// If already logged in, skip login/register pages
function redirectIfAuthenticated(req, res, next) {
  if (req.session.userId) {
    return res.redirect('/');
  }
  next();
}

module.exports = { loadUser, requireAuth, requireAdmin, redirectIfAuthenticated };
