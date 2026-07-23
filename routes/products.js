const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { requireAuth } = require('../middleware/auth');

const PAGE_SIZE = 9;

// GET /products - catalog with search, category filter, sort, pagination
router.get('/', async (req, res, next) => {
  try {
    const { q, category, sort, minPrice, maxPrice } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const filter = { isActive: true };

    if (q) {
      filter.$text = { $search: q };
    }

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'name_asc') sortOption = { name: 1 };
    if (sort === 'rating') sortOption = { ratingAverage: -1 };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category')
      .sort(sortOption)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    const categories = await Category.find({ isActive: true });
    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

    res.render('products/list', {
      title: category ? `${category} - Products` : 'All Products',
      products,
      categories,
      total,
      page,
      totalPages,
      query: { q, category, sort, minPrice, maxPrice },
    });
  } catch (err) {
    next(err);
  }
});

// GET /products/:slug - product details page
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category');
    if (!product) {
      return res.status(404).render('404', { title: 'Product Not Found' });
    }

    const [related, reviews] = await Promise.all([
      Product.find({
        category: product.category?._id,
        _id: { $ne: product._id },
        isActive: true,
      }).limit(4),
      Review.find({ product: product._id }).sort({ createdAt: -1 }).limit(20),
    ]);

    let myReview = null;
    if (req.session.userId) {
      myReview = reviews.find((r) => String(r.user) === String(req.session.userId)) || null;
    }

    res.render('products/details', {
      title: product.name,
      product,
      related,
      reviews,
      myReview,
      errors: [],
    });
  } catch (err) {
    next(err);
  }
});

// POST /products/:slug/reviews - submit or update a review
router.post('/:slug/reviews', requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).render('404', { title: 'Product Not Found' });

    const rating = Math.min(Math.max(parseInt(req.body.rating, 10) || 5, 1), 5);
    const comment = (req.body.comment || '').trim();

    await Review.findOneAndUpdate(
      { product: product._id, user: req.session.userId },
      {
        product: product._id,
        user: req.session.userId,
        userName: res.locals.currentUser.name,
        rating,
        comment,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const agg = await Review.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    if (agg.length) {
      product.ratingAverage = Math.round(agg[0].avg * 10) / 10;
      product.ratingCount = agg[0].count;
      await product.save();
    }

    req.flash('success', 'Thank you for your review!');
    res.redirect(`/products/${product.slug}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
