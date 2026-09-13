require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
  console.log('Connected to DB');
  
  const existingAdmin = await User.findOne({ email: 'admin@motorwise.com' });
  if (existingAdmin) {
    console.log('Admin already exists.');
    process.exit();
  }

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = new User({
    name: 'Amit Sharma',
    email: 'admin@motorwise.com',
    password_hash: hashedPassword,
    role: 'admin',
    phone: '9876543210',
    status: 'active'
  });

  await admin.save();
  console.log('Admin user created: admin@motorwise.com / password123');
  process.exit();
}).catch(console.error);
