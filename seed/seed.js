/**
 * Seed script — populates the database with an admin account, categories,
 * and sample products so the app is usable right after setup.
 *
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Review = require('../models/Review');
const ContactMessage = require('../models/ContactMessage');

const categoriesData = [
  {
    name: 'Cakes',
    description: 'Rich, moist layer cakes for every celebration.',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
  },
  {
    name: 'Breads',
    description: 'Slow-fermented sourdough and everyday loaves.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
  },
  {
    name: 'Pastries',
    description: 'Flaky, buttery croissants and danishes.',
    image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600',
  },
  {
    name: 'Cookies',
    description: 'Classic and gourmet cookies, baked to order.',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
  },
  {
    name: 'Cupcakes',
    description: 'Single-serve cakes topped with handmade frosting.',
    image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600',
  },
  {
    name: 'Beverages',
    description: 'Coffee, tea, and cold drinks to go with your treats.',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600',
  },
];

const productsData = [
  // Cakes
  { name: 'Classic Chocolate Fudge Cake', category: 'Cakes', price: 2800, discountPrice: 2200, stock: 14, isFeatured: true,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=700',
    description: 'A rich, three-layer chocolate cake with dark fudge frosting and chocolate shavings.',
    ingredients: 'Flour, cocoa powder, butter, sugar, eggs, dark chocolate, vanilla extract.', weightGrams: 1200 },
  { name: 'Red Velvet Cake', category: 'Cakes', price: 3000, stock: 10, isFeatured: true,
    image: 'https://images.unsplash.com/photo-1586985289906-406988974504?w=700',
    description: 'Soft red velvet sponge layered with tangy cream cheese frosting.',
    ingredients: 'Flour, cocoa, buttermilk, cream cheese, butter, sugar, food coloring.', weightGrams: 1100 },
  { name: 'Lemon Blueberry Cake', category: 'Cakes', price: 2600, stock: 8,
    image: 'https://images.unsplash.com/photo-1519340333755-56e9c1d04579?w=700',
    description: 'Zesty lemon sponge folded with fresh blueberries and lemon glaze.',
    ingredients: 'Flour, lemon zest, blueberries, butter, sugar, eggs.', weightGrams: 1000 },
  { name: 'Carrot Walnut Cake', category: 'Cakes', price: 2700, stock: 6,
    image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=700',
    description: 'Spiced carrot cake studded with walnuts and topped with cream cheese icing.',
    ingredients: 'Carrots, walnuts, flour, cinnamon, cream cheese, sugar.', weightGrams: 1100 },

  // Breads
  { name: 'Classic Sourdough Loaf', category: 'Breads', price: 350, stock: 25, isFeatured: true,
    image: 'https://images.unsplash.com/photo-1585478259715-4d3a5a1c0a08?w=700',
    description: 'Naturally leavened sourdough with a crisp crust and open, airy crumb.',
    ingredients: 'Flour, water, salt, sourdough starter.', weightGrams: 800 },
  { name: 'Whole Wheat Multigrain Loaf', category: 'Breads', price: 300, stock: 20,
    image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=700',
    description: 'Hearty multigrain bread packed with oats, flax, and sunflower seeds.',
    ingredients: 'Whole wheat flour, oats, flaxseed, sunflower seeds, honey.', weightGrams: 750 },
  { name: 'French Baguette', category: 'Breads', price: 150, discountPrice: 120, stock: 30,
    image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=700',
    description: 'Crispy on the outside, soft on the inside — a true French classic.',
    ingredients: 'Flour, water, yeast, salt.', weightGrams: 300 },
  { name: 'Garlic Herb Focaccia', category: 'Breads', price: 400, stock: 12,
    image: 'https://images.unsplash.com/photo-1573140401552-3fab0b24427f?w=700',
    description: 'Olive oil focaccia topped with roasted garlic and fresh rosemary.',
    ingredients: 'Flour, olive oil, garlic, rosemary, sea salt.', weightGrams: 600 },

  // Pastries
  { name: 'Butter Croissant', category: 'Pastries', price: 150, stock: 40, isFeatured: true,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=700',
    description: 'Flaky, laminated croissant made with French butter.',
    ingredients: 'Flour, butter, milk, yeast, sugar.', weightGrams: 90 },
  { name: 'Almond Danish', category: 'Pastries', price: 220, stock: 18,
    image: 'https://images.unsplash.com/photo-1509365390695-33acf7326b34?w=700',
    description: 'Puff pastry filled with almond cream and toasted almond flakes.',
    ingredients: 'Puff pastry, almond paste, butter, sugar.', weightGrams: 110 },
  { name: 'Chocolate Pain au Chocolat', category: 'Pastries', price: 180, stock: 22,
    image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=700',
    description: 'Buttery laminated pastry wrapped around dark chocolate batons.',
    ingredients: 'Flour, butter, dark chocolate, yeast.', weightGrams: 95 },

  // Cookies
  { name: 'Classic Chocolate Chip Cookies (6pc)', category: 'Cookies', price: 450, stock: 35, isFeatured: true,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=700',
    description: 'Chewy cookies loaded with semi-sweet chocolate chunks.',
    ingredients: 'Flour, butter, brown sugar, chocolate chips, eggs.', weightGrams: 300 },
  { name: 'Oatmeal Raisin Cookies (6pc)', category: 'Cookies', price: 400, stock: 20,
    image: 'https://images.unsplash.com/photo-1490567674331-72135e9d3ed6?w=700',
    description: 'Soft oatmeal cookies with plump raisins and a hint of cinnamon.',
    ingredients: 'Oats, flour, raisins, cinnamon, butter, brown sugar.', weightGrams: 300 },
  { name: 'Double Chocolate Cookies (6pc)', category: 'Cookies', price: 480, stock: 4,
    image: 'https://images.unsplash.com/photo-1548365328-8b849e6c7b5f?w=700',
    description: 'Fudgy cocoa cookies stuffed with white and dark chocolate chunks.',
    ingredients: 'Flour, cocoa powder, white chocolate, dark chocolate, butter.', weightGrams: 320 },

  // Cupcakes
  { name: 'Vanilla Bean Cupcakes (4pc)', category: 'Cupcakes', price: 500, stock: 15,
    image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=700',
    description: 'Light vanilla bean cupcakes topped with swirled buttercream.',
    ingredients: 'Flour, vanilla bean, butter, sugar, eggs.', weightGrams: 320 },
  { name: 'Salted Caramel Cupcakes (4pc)', category: 'Cupcakes', price: 550, discountPrice: 450, stock: 10, isFeatured: true,
    image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=700',
    description: 'Moist cupcakes filled with salted caramel and topped with caramel buttercream.',
    ingredients: 'Flour, caramel, sea salt, butter, sugar.', weightGrams: 340 },
  { name: 'Red Velvet Cupcakes (4pc)', category: 'Cupcakes', price: 550, stock: 0,
    image: 'https://images.unsplash.com/photo-1614203858517-c8934f9ff742?w=700',
    description: 'Mini red velvet cakes topped with cream cheese frosting.',
    ingredients: 'Flour, cocoa, buttermilk, cream cheese, butter.', weightGrams: 320 },

  // Beverages
  { name: 'Cold Brew Coffee (500ml)', category: 'Beverages', price: 350, stock: 30,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=700',
    description: 'Smooth, slow-steeped cold brew with a naturally sweet finish.',
    ingredients: 'Arabica coffee, filtered water.', weightGrams: 500 },
  { name: 'Masala Chai (500ml)', category: 'Beverages', price: 250, stock: 25,
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=700',
    description: 'Spiced tea brewed with cardamom, cinnamon, and fresh ginger.',
    ingredients: 'Black tea, milk, cardamom, cinnamon, ginger.', weightGrams: 500 },
];

async function seed() {
  await connectDB();
  console.log('Seeding database...');

  // --- Admin user ---
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@sweetcrumb.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Store Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
    });
    console.log(`✔ Admin account created -> ${adminEmail}`);
  } else {
    console.log('• Admin account already exists, skipping.');
  }

  // --- Demo customer (handy for testing checkout) ---
  const demoEmail = 'customer@sweetcrumb.com';
  let demoCustomer = await User.findOne({ email: demoEmail });
  if (!demoCustomer) {
    demoCustomer = await User.create({
      name: 'Demo Customer',
      email: demoEmail,
      password: 'Customer@123',
      role: 'customer',
      phone: '03001234567',
      address: {
        fullName: 'Demo Customer',
        phone: '03001234567',
        line1: '45 Model Town',
        city: 'Lahore',
        postalCode: '54000',
      },
    });
    console.log(`✔ Demo customer account created -> ${demoEmail} / Customer@123`);
  } else {
    console.log('• Demo customer already exists, skipping.');
  }

  // --- Categories ---
  const categoryMap = {};
  for (const cat of categoriesData) {
    let existing = await Category.findOne({ name: cat.name });
    if (!existing) {
      existing = await Category.create(cat);
      console.log(`✔ Category created: ${cat.name}`);
    }
    categoryMap[cat.name] = existing._id;
  }

  // --- Products ---
  const existingProductCount = await Product.countDocuments();
  if (existingProductCount === 0) {
    for (const p of productsData) {
      await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        discountPrice: p.discountPrice || null,
        category: categoryMap[p.category],
        image: p.image,
        stock: p.stock,
        ingredients: p.ingredients,
        weightGrams: p.weightGrams || null,
        isFeatured: !!p.isFeatured,
        ratingAverage: Math.round((3.8 + Math.random() * 1.2) * 10) / 10,
        ratingCount: Math.floor(Math.random() * 40) + 3,
      });
    }
    console.log(`✔ ${productsData.length} sample products created.`);
  } else {
    console.log('• Products already exist, skipping product seed.');
  }

  console.log('\nSeeding complete!');
  console.log('----------------------------------------');
  console.log(`Admin login:     ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);
  console.log(`Demo customer:   ${demoEmail} / Customer@123`);
  console.log('----------------------------------------\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});