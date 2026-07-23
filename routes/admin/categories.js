const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../../models/Category');
const Product = require('../../models/Product');

// GET /admin/categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const counts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => { countMap[c._id] = c.count; });

    res.render('admin/categories/list', {
      title: 'Manage Categories',
      categories,
      countMap,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/new', (req, res) => {
  res.render('admin/categories/form', {
    title: 'Add Category',
    category: {},
    errors: [],
    isEdit: false,
  });
});

const validateCategory = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
];

router.post('/', validateCategory, async (req, res, next) => {
  const errors = validationResult(req);
  const { name, description, image } = req.body;

  if (!errors.isEmpty()) {
    return res.render('admin/categories/form', {
      title: 'Add Category',
      category: req.body,
      errors: errors.array(),
      isEdit: false,
    });
  }

  try {
    await Category.create({ name, description, image });
    req.flash('success', 'Category created.');
    res.redirect('/admin/categories');
  } catch (err) {
    if (err.code === 11000) {
      return res.render('admin/categories/form', {
        title: 'Add Category',
        category: req.body,
        errors: [{ msg: 'A category with that name already exists.' }],
        isEdit: false,
      });
    }
    next(err);
  }
});

router.get('/:id/edit', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/admin/categories');
    }
    res.render('admin/categories/form', {
      title: 'Edit Category',
      category,
      errors: [],
      isEdit: true,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id', validateCategory, async (req, res, next) => {
  const errors = validationResult(req);
  const { name, description, image, isActive } = req.body;

  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.flash('error', 'Category not found.');
      return res.redirect('/admin/categories');
    }
    if (!errors.isEmpty()) {
      return res.render('admin/categories/form', {
        title: 'Edit Category',
        category: { ...category.toObject(), ...req.body },
        errors: errors.array(),
        isEdit: true,
      });
    }
    category.name = name;
    category.description = description;
    if (image) category.image = image;
    category.isActive = isActive === 'on';
    await category.save();
    req.flash('success', 'Category updated.');
    res.redirect('/admin/categories');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/delete', async (req, res, next) => {
  try {
    const inUse = await Product.countDocuments({ category: req.params.id });
    if (inUse > 0) {
      req.flash('error', `Cannot delete: ${inUse} product(s) still use this category.`);
      return res.redirect('/admin/categories');
    }
    await Category.findByIdAndDelete(req.params.id);
    req.flash('success', 'Category deleted.');
    res.redirect('/admin/categories');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
