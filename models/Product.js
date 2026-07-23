const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: null },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    image: { type: String, default: '/images/placeholder-product.svg' },
    sku: { type: String, unique: true, sparse: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    ingredients: { type: String, default: '' },
    weightGrams: { type: Number, default: null },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre('validate', function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).slice(2, 7);
  }
  next();
});

productSchema.virtual('finalPrice').get(function () {
  return this.discountPrice && this.discountPrice > 0 ? this.discountPrice : this.price;
});

productSchema.virtual('discountPercent').get(function () {
  if (this.discountPrice && this.discountPrice > 0 && this.discountPrice < this.price) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
