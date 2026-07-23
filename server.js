require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const connectDB = require('./config/db');
const { loadUser } = require('./middleware/auth');
const { attachCartCount } = require('./middleware/cartHelper');

const app = express();

// ---- Database ----
connectDB();

// ---- View engine ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ---- Core middleware ----
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// ---- Sessions (persisted in MongoDB) ----
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweetcrumb',
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
    },
  })
);

app.use(flash());

// ---- Locals available in every view ----
app.use(loadUser);
app.use(attachCartCount);
app.use((req, res, next) => {
  res.locals.storeName = process.env.STORE_NAME || 'Sweet Crumb Artisan Bakery';
  res.locals.currencySymbol = process.env.CURRENCY_SYMBOL || '$';
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  res.locals.currentPath = req.path;
  next();
});

// ---- Routes ----
app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/products', require('./routes/products'));
app.use('/cart', require('./routes/cart'));
app.use('/checkout', require('./routes/checkout'));
app.use('/orders', require('./routes/orders'));
app.use('/admin', require('./routes/admin/index'));

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render('error', {
    title: 'Something Went Wrong',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sweet Crumb Bakery server running at http://localhost:${PORT}`);
});
