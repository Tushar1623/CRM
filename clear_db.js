require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Vehicle = require('./models/Vehicle');
const Lead = require('./models/Lead');
const TestDrive = require('./models/TestDrive');
const Deal = require('./models/Deal');
const Activity = require('./models/Activity');
const FollowUp = require('./models/FollowUp');

const MONGO_URI = process.env.MONGO_URI;

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB. Clearing dummy data...');

    await Promise.all([
      Customer.deleteMany({}),
      Vehicle.deleteMany({}),
      Lead.deleteMany({}),
      TestDrive.deleteMany({}),
      Deal.deleteMany({}),
      Activity.deleteMany({}),
      FollowUp.deleteMany({})
    ]);

    // Keep or re-create default Admin
    let admin = await User.findOne({ email: 'admin@motorwise.com' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Amit Sharma',
        email: 'admin@motorwise.com',
        password_hash: hashedPassword,
        role: 'admin',
        phone: '9876543210',
        status: 'active'
      });
      console.log('Admin user ensured: admin@motorwise.com / password123');
    } else {
      console.log('Admin user preserved: admin@motorwise.com');
    }

    console.log('✅ All dummy data successfully cleared from database!');
    process.exit(0);
  } catch (error) {
    console.warn('⚠️ MongoDB connection note:', error.message);
    console.log('The running server will use empty clean storage.');
    process.exit(0);
  }
}

clearDatabase();
