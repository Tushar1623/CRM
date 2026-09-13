require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Contact = require('./models/Contact');
const Deal = require('./models/Deal');
const Activity = require('./models/Activity');

const MONGO_URI = process.env.MONGO_URI;

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas. Seeding data...');

    // Clear existing data to avoid duplicates if run multiple times
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Contact.deleteMany({}),
      Deal.deleteMany({}),
      Activity.deleteMany({})
    ]);

    // Create a User (Agent)
    const agent = await User.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@crm.com',
      role: 'Sales Representative'
    });

    // Create a Company
    const company = await Company.create({
      name: 'TechFlow Solutions',
      domain: 'techflow.io',
      industry: 'Software',
      annualRevenue: 5000000,
      ownerId: agent._id
    });

    // Create a Contact
    const contact = await Contact.create({
      firstName: 'Sam',
      lastName: 'Smith',
      email: 'sam@techflow.io',
      jobTitle: 'CTO',
      companyId: company._id,
      ownerId: agent._id
    });

    // Create Deals
    const deal1 = await Deal.create({
      name: 'TechFlow - Q3 Software License',
      amount: 15000,
      pipelineStage: 'Proposal',
      probability: 70,
      companyId: company._id,
      contactIds: [contact._id],
      ownerId: agent._id
    });

    const deal2 = await Deal.create({
      name: 'Startup Inc - Consultation',
      amount: 4500,
      pipelineStage: 'Closed Won',
      probability: 100,
      ownerId: agent._id
    });

    // Create Activities
    await Activity.create({
      type: 'Call',
      subject: 'Introductory Call with TechFlow',
      status: 'Completed',
      date: new Date(),
      companyId: company._id,
      contactId: contact._id,
      dealId: deal1._id,
      ownerId: agent._id
    });

    await Activity.create({
      type: 'Email',
      subject: 'Sent Proposal Draft',
      status: 'Completed',
      date: new Date(Date.now() - 86400000), // 1 day ago
      dealId: deal1._id,
      ownerId: agent._id
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
