# 🥐 Sweet Crumb Artisan Bakery — Full Stack E-Commerce Web Application

A complete full-stack e-commerce web application for an artisan bakery, built with
**Express.js**, **EJS** (server-rendered views), and **MongoDB** (via Mongoose).
The project includes a full **Customer Website** and a fully separate, protected
**Admin Panel**, both served from a single Express application.

---

## 🧱 Tech Stack

| Layer        | Technology                                              |
|--------------|----------------------------------------------------------|
| Backend      | Node.js, Express.js 4                                    |
| Views        | EJS + express-ejs-layouts (server-side rendering)         |
| Database     | MongoDB with Mongoose ODM                                 |
| Auth         | express-session + connect-mongo (sessions stored in DB), bcryptjs for password hashing |
| Validation   | express-validator                                          |
| File uploads | multer (product images)                                   |
| Flash msgs   | connect-flash                                              |

No frontend framework/build step is used — pages are rendered server-side with EJS,
styled with a single hand-written CSS file (no external CSS framework, no CDN dependency).

---

## ✨ Features

### Customer Website
- Home page with featured products, categories, and new arrivals
- Product catalog with **search, category filter, price filter, sorting, and pagination**
- Product details page with image, stock status, ingredients, and **customer reviews/ratings**
- Cart (add / update quantity / remove / clear), persisted per logged-in user in MongoDB
- Full checkout flow: shipping details, payment method (COD or Card-demo), order confirmation
- Order history and order details, with **cancel order** (while still pending)
- Customer account page: update profile & default shipping address
- Register / Login / Logout (hashed passwords, sessions)
- About and Contact pages (contact form saves messages to the database)
- Fully responsive layout (mobile nav, responsive grids)

### Admin Panel (`/admin`)
- Separate, protected login (`/admin/login`) — only accounts with `role: admin` can access
- Dashboard with key stats: revenue, orders, pending orders, low-stock alert, customers, unread messages, top-rated products, recent orders
- **Products**: full CRUD, image upload (or image URL), stock, pricing, discount price, featured flag, active/hidden toggle, search + pagination
- **Categories**: full CRUD, product-count per category, prevents deleting a category still in use
- **Orders**: list with status filter, order details, update order status (pending → processing → shipped → delivered / cancelled)
- **Customers**: list with order count & total spend, block/unblock accounts
- **Contact Messages**: view, mark as read, delete

### Backend / Database
- Every feature above is backed by real Mongoose models and MongoDB queries — nothing is hardcoded or mocked.
- Server-side validation (express-validator) on every form submission, with errors re-rendered inline.
- Centralized error handling (404 page + generic error page) and flash messages for success/error feedback.
- Stock is decremented on checkout and re-validated before order placement.
- Sessions are stored in MongoDB itself (via `connect-mongo`) rather than in memory, so logins persist across server restarts.

---

## 📁 Project Structure

```
sweetcrumb-bakery/
├── config/
│   └── db.js                 # MongoDB connection
├── middleware/
│   ├── auth.js                # requireAuth / requireAdmin / loadUser
│   ├── cartHelper.js           # cart totals + cart badge middleware
│   └── upload.js               # multer config for product images
├── models/                    # Mongoose schemas
│   ├── User.js
│   ├── Category.js
│   ├── Product.js
│   ├── Cart.js
│   ├── Order.js
│   ├── Review.js
│   └── ContactMessage.js
├── routes/
│   ├── index.js                # home, about, contact, account
│   ├── auth.js                  # register/login/logout
│   ├── products.js              # catalog + product details + reviews
│   ├── cart.js
│   ├── checkout.js
│   ├── orders.js                # customer order history
│   └── admin/
│       ├── index.js             # mounts all admin routes + admin guard
│       ├── auth.js              # admin login/logout
│       ├── dashboard.js
│       ├── products.js
│       ├── categories.js
│       ├── orders.js
│       ├── users.js
│       └── messages.js
├── views/                      # EJS templates (customer + views/admin/*)
├── public/                     # CSS, JS, images, uploaded product images
├── seed/
│   └── seed.js                  # seeds admin user, demo customer, categories & products
├── server.js                    # app entry point
├── package.json
├── .env.example
└── README.md
```

---

## 🚀 Getting Started (Local Setup)

### 1. Prerequisites
- Node.js 18+ and npm
- MongoDB running locally, **or** a free MongoDB Atlas cluster

### 2. Install dependencies
```bash
cd sweetcrumb-bakery
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and edit as needed:
```bash
cp .env.example .env
```

### 4. Seed the database
This creates the admin account, a demo customer account, categories, and ~19 sample products:
```bash
npm run seed
```
You should see output confirming the admin login and demo customer credentials.

### 5. Run the app
```bash
npm run dev     # with nodemon (auto-restart)
# or
npm start       # plain node
```


## 🗄️ Database Notes
- This project uses **MongoDB / Mongoose** exclusively — no SQL database is involved.
- Collections are created automatically on first write: `users`, `categories`, `products`, `carts`, `orders`, `reviews`, `contactmessages`, and `sessions` (used by connect-mongo for session storage).
- To reset all data, drop the database (e.g. `mongosh` → `use sweetcrumb` → `db.dropDatabase()`) and re-run `npm run seed`.

---


## 🔐 Security Notes
- Passwords are hashed with bcrypt before being stored (never stored in plain text).
- Sessions are httpOnly cookies backed by a MongoDB-based session store.
- All form inputs are validated server-side with express-validator.
- The admin panel is fully gated behind `requireAdmin` middleware — no route under `/admin` (other than the login page) is reachable without an authenticated admin session.
- Uploaded product images are restricted by file type (png/jpg/jpeg/webp/gif) and size (3MB max).

---
