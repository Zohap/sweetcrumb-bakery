const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const upload = require('../../middleware/upload');

const PAGE_SIZE = 10;

// GET /admin/products - list with search + pagination
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const { q } = req.query;
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    res.render('admin/products/list', {
      title: 'Manage Products',
      products,
      page,
      totalPages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      q: q || '',
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/products/new
router.get('/new', async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render('admin/products/form', {
      title: 'Add Product',
      product: {},
      categories,
      errors: [],
      isEdit: false,
    });
  } catch (err) {
    next(err);
  }
});

const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('discountPrice')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be zero or more'),
];

// POST /admin/products - create
router.post('/', upload.single('imageFile'), validateProduct, async (req, res, next) => {
  const errors = validationResult(req);
  try {
    const categories = await Category.find().sort({ name: 1 });
    if (!errors.isEmpty()) {
      return res.render('admin/products/form', {
        title: 'Add Product',
        product: req.body,
        categories,
        errors: errors.array(),
        isEdit: false,
      });
    }

    const {
      name, description, price, discountPrice, category,
      stock, sku, ingredients, weightGrams, isFeatured, imageUrl,
    } = req.body;

    let image = '/images/placeholder-product.svg';
    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    } else if (imageUrl) {
      image = imageUrl;
    }

    await Product.create({
      name,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      category,
      stock: Number(stock),
      sku: sku || undefined,
      ingredients,
      weightGrams: weightGrams ? Number(weightGrams) : null,
      isFeatured: isFeatured === 'on',
      image,
    });

    req.flash('success', 'Product created successfully.');
    res.redirect('/admin/products');
  } catch (err) {
    if (err.code === 11000) {
      const categories = await Category.find().sort({ name: 1 });
      return res.render('admin/products/form', {
        title: 'Add Product',
        product: req.body,
        categories,
        errors: [{ msg: 'A product with that SKU already exists.' }],
        isEdit: false,
      });
    }
    next(err);
  }
});

// GET /admin/products/:id/edit
router.get('/:id/edit', async (req, res, next) => {
  try {
    const [product, categories] = await Promise.all([
      Product.findById(req.params.id),
      Category.find().sort({ name: 1 }),
    ]);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/products');
    }
    res.render('admin/products/form', {
      title: 'Edit Product',
      product,
      categories,
      errors: [],
      isEdit: true,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/products/:id - update
router.post('/:id', upload.single('imageFile'), validateProduct, async (req, res, next) => {
  const errors = validationResult(req);
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/products');
    }

    const categories = await Category.find().sort({ name: 1 });
    if (!errors.isEmpty()) {
      return res.render('admin/products/form', {
        title: 'Edit Product',
        product: { ...product.toObject(), ...req.body },
        categories,
        errors: errors.array(),
        isEdit: true,
      });
    }

    const {
      name, description, price, discountPrice, category,
      stock, sku, ingredients, weightGrams, isFeatured, isActive, imageUrl,
    } = req.body;

    product.name = name;
    product.description = description;
    product.price = Number(price);
    product.discountPrice = discountPrice ? Number(discountPrice) : null;
    product.category = category;
    product.stock = Number(stock);
    product.sku = sku || product.sku;
    product.ingredients = ingredients;
    product.weightGrams = weightGrams ? Number(weightGrams) : null;
    product.isFeatured = isFeatured === 'on';
    product.isActive = isActive === 'on';

    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    } else if (imageUrl) {
      product.image = imageUrl;
    }

    await product.save();
    req.flash('success', 'Product updated successfully.');
    res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
});

// POST /admin/products/:id/delete
router.post('/:id/delete', async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success', 'Product deleted.');
    res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
