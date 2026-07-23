const express = require('express');
const router = express.Router();
const ContactMessage = require('../../models/ContactMessage');

// GET /admin/messages
router.get('/', async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.render('admin/messages/list', { title: 'Contact Messages', messages });
  } catch (err) {
    next(err);
  }
});

// POST /admin/messages/:id/read
router.post('/:id/read', async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true });
    res.redirect('/admin/messages');
  } catch (err) {
    next(err);
  }
});

// POST /admin/messages/:id/delete
router.post('/:id/delete', async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    req.flash('success', 'Message deleted.');
    res.redirect('/admin/messages');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
