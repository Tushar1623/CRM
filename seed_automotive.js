require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Vehicle = require('./models/Vehicle');
const Lead = require('./models/Lead');
const TestDrive = require('./models/TestDrive');
const Deal = require('./models/Deal');
const Activity = require('./models/Activity');

const MONGO_URI = process.env.MONGO_URI;

async function seedAutomotive() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Seeding Used Car CRM data...');

    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Vehicle.deleteMany({}),
      Lead.deleteMany({}),
      TestDrive.deleteMany({}),
      Deal.deleteMany({}),
      Activity.deleteMany({})
    ]);

    // Create Agent
    const agent = await User.create({
      name: 'Amit Sharma',
      email: 'amit@usedcarcrm.com',
      role: 'Sales Executive'
    });

    // Create Customer
    const customer = await Customer.create({
      name: 'Rahul Das',
      phone: '9876543210',
      city: 'Mumbai'
    });

    // Create Vehicles
    const car1 = await Vehicle.create({
      stock_id: 'STK-001',
      brand: 'Hyundai',
      model: 'Creta SX',
      year: 2021,
      fuel: 'Petrol',
      km_driven: 38000,
      selling_price: 850000,
      status: 'Available'
    });

    const car2 = await Vehicle.create({
      stock_id: 'STK-002',
      brand: 'Maruti Suzuki',
      model: 'Swift VXI',
      year: 2020,
      fuel: 'Petrol',
      km_driven: 44000,
      selling_price: 520000,
      status: 'Available'
    });
    
    const car3 = await Vehicle.create({
      stock_id: 'STK-003',
      brand: 'Honda',
      model: 'City VX',
      year: 2019,
      fuel: 'Petrol',
      km_driven: 62000,
      selling_price: 710000,
      status: 'Sold'
    });

    // Create Lead
    const lead = await Lead.create({
      customer_id: customer._id,
      source: 'Facebook',
      assigned_to: agent._id,
      priority: 'Hot',
      status: 'Test Drive Scheduled'
    });

    // Create Test Drive
    await TestDrive.create({
      customer_id: customer._id,
      vehicle_id: car1._id,
      employee_id: agent._id,
      date: new Date(),
      time: '14:00',
      status: 'Scheduled'
    });

    console.log('Automotive Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedAutomotive();
