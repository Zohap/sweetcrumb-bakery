const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sweetcrumb';

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected -> ${mongoose.connection.name}`);
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    console.error(
      '  Make sure MongoDB is running and MONGODB_URI in your .env file is correct.'
    );
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected');
  });
}

module.exports = connectDB;
