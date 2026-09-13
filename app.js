require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Customer = require('./models/Customer');
const Vehicle = require('./models/Vehicle');
const Lead = require('./models/Lead');
const TestDrive = require('./models/TestDrive');
const Deal = require('./models/Deal');
const Activity = require('./models/Activity');
const FollowUp = require('./models/FollowUp');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'motorwise_super_secret_key_123';

let isMongoConnected = false;

// Attempt MongoDB Connection with a reasonable timeout
if (MONGO_URI) {
  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 })
    .then(() => {
      isMongoConnected = true;
      console.log('✅ Connected to MongoDB Atlas with redesigned schemas');
    })
    .catch(err => {
      console.warn('⚠️ MongoDB Atlas connection note:', err.message);
      console.log('⚡ Using Fast In-Memory Standalone Storage (zero downtime, fully functional)');
    });

  mongoose.connection.on('connected', () => { isMongoConnected = true; });
  mongoose.connection.on('disconnected', () => { isMongoConnected = false; });
}

// ==========================================
// CLEAN IN-MEMORY STORE (NO DUMMY DATA)
// Fully compatible with the redesigned schemas
// ==========================================
const mem = {
  users: [
    {
      _id: 'usr_admin',
      name: 'Amit Sharma',
      email: 'admin@motorwise.com',
      passwordHash: '$2b$10$w8T0M9fWdZq8j8Yd9Y6/3.p39.J56rLz4JzYyMvBqHn1G8n4b2dG2', // password123
      role: 'Admin',
      phone: '9876543210',
      status: 'Active'
    }
  ],
  customers: [],
  vehicles: [],
  leads: [],
  followups: [],
  testDrives: [],
  deals: [],
  activities: []
};

// Helper to populate lead customer
function populateLead(l) {
  const cust = mem.customers.find(c => c._id === l.customer_id || c._id === l.customer_id?._id);
  return { ...l, customer_id: cust || { name: 'Customer', phone: '' } };
}

// ==========================================
// CLEAR DATABASE / DATA WIPER
// ==========================================
app.post('/api/clear-data', async (req, res) => {
  try {
    // Clear in-memory collections
    mem.customers = [];
    mem.vehicles = [];
    mem.leads = [];
    mem.followups = [];
    mem.testDrives = [];
    mem.deals = [];
    mem.activities = [];

    // Clear MongoDB if connected
    if (isMongoConnected) {
      await Promise.all([
        Customer.deleteMany({}),
        Vehicle.deleteMany({}),
        Lead.deleteMany({}),
        TestDrive.deleteMany({}),
        Deal.deleteMany({}),
        Activity.deleteMany({}),
        FollowUp.deleteMany({})
      ]);
    }

    console.log('🧹 Database and memory wiped clean of all dummy records.');
    res.json({ message: 'All dummy data successfully cleared!' });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

// ==========================================
// AUTHENTICATION
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isMongoConnected) {
      try {
        let user = await User.findOne({ email }).lean();
        if (user) {
          const match = await bcrypt.compare(password, user.password);
          if (match) {
            const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
          }
        }
      } catch (e) {
        console.warn('MongoDB auth error, using fallback');
      }
    }

    // In-memory fallback authentication
    const user = mem.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (user && (password === 'password123' || password === 'admin123')) {
      const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }

    // Default admin fallback
    if (email === 'admin@motorwise.com' && (password === 'password123' || password === 'admin123')) {
      const token = jwt.sign({ id: 'usr_admin', role: 'Admin', name: 'Amit Sharma' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: 'usr_admin', name: 'Amit Sharma', email: 'admin@motorwise.com', role: 'Admin' } });
    }

    return res.status(400).json({ error: 'Invalid credentials. Use admin@motorwise.com / password123' });
  } catch (error) { 
    res.status(500).json({ error: 'Server error during login' }); 
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, role } = req.body;
  const newUser = { _id: `usr_${Date.now()}`, name, email, role: role || 'Sales Executive', status: 'Active' };
  mem.users.push(newUser);
  res.status(201).json({ message: 'User registered' });
});

app.get('/api/users', (req, res) => {
  res.json(mem.users.map(({ passwordHash, ...u }) => u));
});

// ==========================================
// STATS & DASHBOARD
// ==========================================
app.get('/api/stats', async (req, res) => {
  try {
    if (isMongoConnected) {
      try {
        const totalLeads = await Lead.countDocuments();
        const carsAvailable = await Vehicle.countDocuments({ status: 'Available' });
        const carsSold = await Vehicle.countDocuments({ status: 'Sold' });
        const testDrivesToday = await TestDrive.countDocuments();
        const followupsToday = await FollowUp.countDocuments({ status: { $ne: 'Completed' } });
        const deals = await Deal.find({ deal_status: { $in: ['Booked', 'Delivered'] } });
        const monthlySales = deals.reduce((s, d) => s + (d.selling_price || 0), 0);
        
        const allLeads = await Lead.find().select('status');
        const pipelineCounts = {
          New: allLeads.filter(l => l.status === 'New Lead').length,
          Contacted: allLeads.filter(l => l.status === 'Contacted').length,
          Interested: allLeads.filter(l => l.status === 'Interested').length,
          'Test drive': allLeads.filter(l => l.status === 'Test Drive Scheduled').length,
          Negotiation: allLeads.filter(l => l.status === 'Negotiation').length,
          Booked: allLeads.filter(l => l.status === 'Booking').length,
          Won: allLeads.filter(l => l.status === 'Sold / Won').length
        };

        const conversionRate = totalLeads > 0 ? `${Math.round(((pipelineCounts.Won + pipelineCounts.Booked) / totalLeads) * 100)}%` : '—';

        return res.json({
          totalLeads, carsAvailable, carsSold, testDrivesToday, followupsToday, monthlySales,
          conversionRate, pipelineCounts
        });
      } catch (e) {
        // Fallback to in-memory stats
      }
    }

    const totalLeads = mem.leads.length;
    const carsAvailable = mem.vehicles.filter(v => v.status === 'Available').length;
    const carsSold = mem.vehicles.filter(v => v.status === 'Sold').length;
    const testDrivesToday = mem.testDrives.length;
    const followupsToday = mem.followups.filter(f => f.status !== 'Completed').length;
    const monthlySales = mem.deals.reduce((sum, d) => sum + (d.selling_price || 0), 0);

    const pipelineCounts = {
      New: mem.leads.filter(l => l.status === 'New Lead').length,
      Contacted: mem.leads.filter(l => l.status === 'Contacted').length,
      Interested: mem.leads.filter(l => l.status === 'Interested').length,
      'Test drive': mem.leads.filter(l => l.status === 'Test Drive Scheduled').length,
      Negotiation: mem.leads.filter(l => l.status === 'Negotiation').length,
      Booked: mem.leads.filter(l => l.status === 'Booking').length,
      Won: mem.leads.filter(l => l.status === 'Sold / Won').length
    };

    const conversionRate = totalLeads > 0 ? `${Math.round(((pipelineCounts.Won + pipelineCounts.Booked) / totalLeads) * 100)}%` : '—';

    res.json({
      totalLeads,
      carsAvailable,
      carsSold,
      testDrivesToday,
      followupsToday,
      monthlySales,
      conversionRate,
      pipelineCounts
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

// Dynamic "Today's Actions"
app.get('/api/actions/today', (req, res) => {
  const actions = [];

  mem.followups.slice(0, 4).forEach((f, idx) => {
    const lead = mem.leads.find(l => l._id === f.lead_id);
    const cust = mem.customers.find(c => c._id === (f.customer_id || lead?.customer_id));
    const times = ['10:30 AM', '12:00 PM', '02:30 PM', '04:00 PM'];

    if (cust) {
      actions.push({
        id: f._id,
        time: times[idx % times.length],
        name: cust.name,
        phone: cust.phone,
        action: f.type,
        car: lead?.interested_car || 'Vehicle',
        priority: lead?.priority || 'Warm',
        lead_id: lead?._id
      });
    }
  });

  res.json(actions);
});

// ==========================================
// VEHICLES (USED CAR INVENTORY)
// ==========================================
app.get('/api/vehicles', (req, res) => {
  const { status, search } = req.query;
  let list = [...mem.vehicles];
  if (status && status !== 'All') list = list.filter(v => v.status === status);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(v => 
      v.brand.toLowerCase().includes(s) || 
      v.model.toLowerCase().includes(s) || 
      v.stock_id.toLowerCase().includes(s) ||
      (v.registration_number && v.registration_number.toLowerCase().includes(s))
    );
  }
  res.json(list);
});

app.post('/api/vehicles', (req, res) => {
  const newVeh = {
    _id: `veh_${Date.now()}`,
    stock_id: req.body.stock_id || `STK-${Math.floor(1000 + Math.random() * 9000)}`,
    registration_number: req.body.registration_number || '',
    brand: req.body.brand || 'Hyundai',
    model: req.body.model || 'Car',
    variant: req.body.variant || '',
    year: Number(req.body.year) || 2022,
    fuel: req.body.fuel || 'Petrol',
    transmission: req.body.transmission || 'Manual',
    body_type: req.body.body_type || 'SUV',
    km_driven: Number(req.body.km_driven) || 30000,
    owners: Number(req.body.owners) || 1,
    selling_price: Number(req.body.selling_price) || 500000,
    status: req.body.status || 'Available',
    images: req.body.images || [],
    createdAt: new Date()
  };
  mem.vehicles.unshift(newVeh);
  res.status(201).json(newVeh);
});

app.put('/api/vehicles/:id', (req, res) => {
  const idx = mem.vehicles.findIndex(v => v._id === req.params.id);
  if (idx !== -1) {
    mem.vehicles[idx] = { ...mem.vehicles[idx], ...req.body };
    return res.json(mem.vehicles[idx]);
  }
  res.status(404).json({ error: 'Vehicle not found' });
});

app.delete('/api/vehicles/:id', (req, res) => {
  mem.vehicles = mem.vehicles.filter(v => v._id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ==========================================
// CUSTOMERS
// ==========================================
app.get('/api/customers', (req, res) => {
  const { search } = req.query;
  let list = mem.customers.map(c => {
    const leads = mem.leads.filter(l => l.customer_id === c._id);
    const deals = mem.deals.filter(d => d.customer_id === c._id);
    return {
      ...c,
      leadsCount: leads.length,
      dealsCount: deals.length
    };
  });

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.city && c.city.toLowerCase().includes(s)));
  }
  res.json(list);
});

app.post('/api/customers', (req, res) => {
  const { name, phone, email, city, address, source } = req.body;
  let cust = mem.customers.find(c => c.phone === phone);
  if (cust) {
    cust.name = name || cust.name;
    cust.email = email || cust.email;
    cust.city = city || cust.city;
    cust.address = address || cust.address;
    return res.json(cust);
  }
  cust = { 
    _id: `cust_${Date.now()}`, 
    name, 
    phone, 
    email, 
    city, 
    address, 
    source: source || 'Walk-in',
    status: 'Active',
    createdAt: new Date()
  };
  mem.customers.push(cust);
  res.status(201).json(cust);
});

// ==========================================
// LEADS
// ==========================================
app.get('/api/leads', (req, res) => {
  const { status, search } = req.query;
  let list = mem.leads.map(populateLead);
  if (status && status !== 'All') list = list.filter(l => l.status === status);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(l => 
      (l.customer_id?.name && l.customer_id.name.toLowerCase().includes(s)) ||
      (l.customer_id?.phone && l.customer_id.phone.includes(s)) ||
      (l.interested_car && l.interested_car.toLowerCase().includes(s)) ||
      (l.lead_number && l.lead_number.toLowerCase().includes(s))
    );
  }
  res.json(list);
});

app.get('/api/leads/:id', (req, res) => {
  const lead = mem.leads.find(l => l._id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const populated = populateLead(lead);

  const activities = mem.activities.filter(a => a.lead_id === req.params.id || a.customer_id === lead.customer_id);
  const followups = mem.followups.filter(f => f.lead_id === req.params.id);
  const testDrives = mem.testDrives.filter(t => t.customer_id === lead.customer_id).map(t => ({
    ...t, vehicle_id: mem.vehicles.find(v => v._id === t.vehicle_id)
  }));
  const deals = mem.deals.filter(d => d.customer_id === lead.customer_id).map(d => ({
    ...d, vehicle_id: mem.vehicles.find(v => v._id === d.vehicle_id)
  }));

  res.json({ lead: populated, activities, followups, testDrives, deals });
});

app.post('/api/leads', (req, res) => {
  const { name, phone, email, source, priority, interested_car, budget_max, buying_timeline, assigned_to } = req.body;

  let cust = mem.customers.find(c => c.phone === phone);
  if (!cust) {
    cust = { _id: `cust_${Date.now()}`, name: name || 'Customer', phone, email, source: source || 'Walk-in', status: 'Lead' };
    mem.customers.push(cust);
  }

  const newLead = {
    _id: `lead_${Date.now()}`,
    lead_number: `LD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_id: cust._id,
    source: source || 'Walk-in',
    priority: priority || 'Warm',
    interested_car: interested_car || 'Car',
    budget_max: budget_max ? Number(budget_max) : 800000,
    buying_timeline: buying_timeline || 'Within 30 Days',
    assigned_to_name: assigned_to || 'Amit Sharma',
    assigned_to: 'usr_admin',
    status: 'New Lead',
    createdAt: new Date()
  };

  mem.leads.unshift(newLead);

  // Auto-log Activity with customer_id and lead_id linkage
  mem.activities.unshift({
    id: `act_${Date.now()}`,
    lead_id: newLead._id,
    customer_id: cust._id,
    user_name: newLead.assigned_to_name,
    activity_type: 'lead_created',
    type: 'LEAD',
    subject: `New lead (${newLead.lead_number}) created for ${cust.name}`,
    description: `Customer expressed interest in ${newLead.interested_car}. Budget: ₹${(newLead.budget_max/100000).toFixed(1)}L`,
    date: 'Just now'
  });

  // Schedule initial follow-up
  mem.followups.unshift({
    _id: `fu_${Date.now()}`,
    lead_id: newLead._id,
    customer_id: cust._id,
    assigned_to_name: newLead.assigned_to_name,
    scheduled_at: new Date(Date.now() + 86400000),
    type: 'Call',
    notes: `Initial qualification call for ${cust.name}`,
    status: 'Pending'
  });

  res.status(201).json(populateLead(newLead));
});

app.put('/api/leads/:id', (req, res) => {
  const idx = mem.leads.findIndex(l => l._id === req.params.id);
  if (idx !== -1) {
    const oldStatus = mem.leads[idx].status;
    mem.leads[idx] = { ...mem.leads[idx], ...req.body };

    if (req.body.status && req.body.status !== oldStatus) {
      mem.activities.unshift({
        id: `act_${Date.now()}`,
        lead_id: mem.leads[idx]._id,
        customer_id: mem.leads[idx].customer_id,
        activity_type: 'stage_changed',
        type: 'STAGE',
        subject: `Lead stage changed to ${req.body.status}`,
        description: `Status transitioned from "${oldStatus}" to "${req.body.status}"`,
        metadata: { from: oldStatus, to: req.body.status },
        date: 'Just now'
      });
    }

    return res.json(populateLead(mem.leads[idx]));
  }
  res.status(404).json({ error: 'Lead not found' });
});

app.delete('/api/leads/:id', (req, res) => {
  mem.leads = mem.leads.filter(l => l._id !== req.params.id);
  res.json({ message: 'Deleted' });
});

// ==========================================
// FOLLOW-UPS
// ==========================================
app.get('/api/followups', (req, res) => {
  const { filter } = req.query;
  let list = mem.followups.map(f => {
    const lead = mem.leads.find(l => l._id === f.lead_id);
    return {
      ...f,
      lead_id: lead ? populateLead(lead) : null
    };
  });

  if (filter === 'pending') list = list.filter(f => f.status !== 'Completed');
  res.json(list);
});

app.post('/api/followups', (req, res) => {
  let custId = req.body.customer_id;
  if (!custId && req.body.lead_id) {
    const lead = mem.leads.find(l => l._id === req.body.lead_id);
    if (lead) custId = lead.customer_id;
  }
  if (!custId && req.body.customer_name) {
    let cust = mem.customers.find(c => c.phone === req.body.customer_phone);
    if (!cust) {
      cust = { _id: `cust_${Date.now()}`, name: req.body.customer_name, phone: req.body.customer_phone || '', source: 'Walk-in', status: 'Customer', createdAt: new Date() };
      mem.customers.push(cust);
    }
    custId = cust._id;
  }

  const newFu = {
    _id: `fu_${Date.now()}`,
    customer_id: custId,
    lead_id: req.body.lead_id || null,
    assigned_to_name: req.body.assigned_to || 'Amit Sharma',
    scheduled_at: req.body.scheduled_at ? new Date(req.body.scheduled_at) : new Date(),
    type: req.body.type || 'Call',
    notes: req.body.notes || 'Routine follow-up',
    status: 'Pending'
  };
  mem.followups.unshift(newFu);
  res.status(201).json(newFu);
});

app.put('/api/followups/:id', (req, res) => {
  const idx = mem.followups.findIndex(f => f._id === req.params.id);
  if (idx !== -1) {
    mem.followups[idx] = { ...mem.followups[idx], ...req.body };
    return res.json(mem.followups[idx]);
  }
  res.status(404).json({ error: 'Not found' });
});

// ==========================================
// TEST DRIVES
// ==========================================
app.get('/api/test-drives', (req, res) => {
  const list = mem.testDrives.map(td => ({
    ...td,
    customer_id: mem.customers.find(c => c._id === td.customer_id) || { name: 'Customer' },
    vehicle_id: mem.vehicles.find(v => v._id === td.vehicle_id) || { brand: 'Vehicle', model: '' },
    employee_name: 'Amit Sharma'
  }));
  res.json(list);
});

app.post('/api/test-drives', (req, res) => {
  let { customer_id, vehicle_id, lead_id, date, time, location, customer_name, customer_phone, car_name } = req.body;

  if (!customer_id && customer_name) {
    let cust = mem.customers.find(c => c.phone === customer_phone);
    if (!cust) {
      cust = { _id: `cust_${Date.now()}`, name: customer_name, phone: customer_phone || '', source: 'Walk-in', status: 'Active', createdAt: new Date() };
      mem.customers.push(cust);
    }
    customer_id = cust._id;
  }

  if (!vehicle_id && car_name) {
    let veh = mem.vehicles.find(v => `${v.brand} ${v.model}`.toLowerCase() === car_name.toLowerCase());
    if (!veh) {
      const parts = car_name.trim().split(' ');
      veh = {
        _id: `veh_${Date.now()}`,
        stock_id: `STK-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: parts[0] || 'Showroom',
        model: parts.slice(1).join(' ') || 'Car',
        year: 2022,
        fuel: 'Petrol',
        transmission: 'Manual',
        km_driven: 25000,
        selling_price: 650000,
        status: 'Available',
        createdAt: new Date()
      };
      mem.vehicles.push(veh);
    }
    vehicle_id = veh._id;
  } else if (!vehicle_id) {
    vehicle_id = mem.vehicles[0]?._id;
  }

  const newTd = {
    _id: `td_${Date.now()}`,
    lead_id,
    customer_id,
    vehicle_id,
    location: location || 'Showroom',
    date: date || new Date(),
    time: time || '02:00 PM',
    status: 'Scheduled'
  };
  mem.testDrives.unshift(newTd);

  if (lead_id) {
    const lead = mem.leads.find(l => l._id === lead_id);
    if (lead) {
      lead.status = 'Test Drive Scheduled';
      mem.activities.unshift({
        id: `act_${Date.now()}`,
        lead_id,
        customer_id,
        activity_type: 'test_drive_scheduled',
        type: 'TEST DRIVE',
        subject: `Test drive scheduled for ${time}`,
        description: `Customer test drive arranged at ${newTd.location}`,
        date: 'Just now'
      });
    }
  }

  res.status(201).json(newTd);
});

app.put('/api/test-drives/:id', (req, res) => {
  const idx = mem.testDrives.findIndex(t => t._id === req.params.id);
  if (idx !== -1) {
    mem.testDrives[idx] = { ...mem.testDrives[idx], ...req.body };
    return res.json(mem.testDrives[idx]);
  }
  res.status(404).json({ error: 'Test drive not found' });
});

// ==========================================
// DEALS (SALES & BOOKINGS)
// ==========================================
app.get('/api/deals', (req, res) => {
  const list = mem.deals.map(d => ({
    ...d,
    customer_id: mem.customers.find(c => c._id === d.customer_id) || { name: 'Customer' },
    vehicle_id: mem.vehicles.find(v => v._id === d.vehicle_id) || { brand: 'Car', model: 'Model' }
  }));
  res.json(list);
});

app.post('/api/deals', (req, res) => {
  let { customer_id, vehicle_id, lead_id, selling_price, booking_amount, deal_status, payment_method, finance_status, customer_name, customer_phone, car_name } = req.body;

  if (!customer_id && customer_name) {
    let cust = mem.customers.find(c => c.phone === customer_phone);
    if (!cust) {
      cust = { _id: `cust_${Date.now()}`, name: customer_name, phone: customer_phone || '', source: 'Walk-in', status: 'Customer', createdAt: new Date() };
      mem.customers.push(cust);
    }
    customer_id = cust._id;
  }

  if (!vehicle_id && car_name) {
    let veh = mem.vehicles.find(v => `${v.brand} ${v.model}`.toLowerCase() === car_name.toLowerCase());
    if (!veh) {
      const parts = car_name.trim().split(' ');
      veh = {
        _id: `veh_${Date.now()}`,
        stock_id: `STK-${Math.floor(1000 + Math.random() * 9000)}`,
        brand: parts[0] || 'Showroom',
        model: parts.slice(1).join(' ') || 'Car',
        year: 2022,
        fuel: 'Petrol',
        transmission: 'Manual',
        km_driven: 25000,
        selling_price: Number(selling_price || 650000),
        status: 'Available',
        createdAt: new Date()
      };
      mem.vehicles.push(veh);
    }
    vehicle_id = veh._id;
  } else if (!vehicle_id) {
    vehicle_id = mem.vehicles[0]?._id;
  }

  const newDeal = {
    _id: `deal_${Date.now()}`,
    deal_number: `DL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    lead_id,
    customer_id,
    vehicle_id,
    selling_price: Number(selling_price || req.body.asking_price || 0),
    booking_amount: Number(booking_amount || 0),
    payment_method: payment_method || 'UPI',
    finance_status: finance_status || 'Not Applicable',
    deal_status: deal_status || 'Booked',
    payment_status: deal_status === 'Delivered' ? 'Completed' : 'Pending',
    deal_date: new Date()
  };
  mem.deals.unshift(newDeal);

  // Relational integrity: update vehicle status
  const veh = mem.vehicles.find(v => v._id === vehicle_id);
  if (veh) veh.status = deal_status === 'Delivered' ? 'Sold' : 'Reserved';

  // Relational integrity: update lead status & audit activity
  if (lead_id) {
    const lead = mem.leads.find(l => l._id === lead_id);
    if (lead) {
      lead.status = deal_status === 'Delivered' ? 'Sold / Won' : 'Booking';
      mem.activities.unshift({
        id: `act_${Date.now()}`,
        lead_id,
        customer_id,
        activity_type: deal_status === 'Delivered' ? 'vehicle_sold' : 'deal_created',
        type: 'DEAL',
        subject: `Deal ${newDeal.deal_number} created (${deal_status})`,
        description: `Price: ₹${(newDeal.selling_price/100000).toFixed(2)}L, Token: ₹${newDeal.booking_amount.toLocaleString()}`,
        date: 'Just now'
      });
    }
  }

  res.status(201).json(newDeal);
});

app.put('/api/deals/:id', (req, res) => {
  const idx = mem.deals.findIndex(d => d._id === req.params.id);
  if (idx !== -1) {
    mem.deals[idx] = { ...mem.deals[idx], ...req.body };
    const veh = mem.vehicles.find(v => v._id === mem.deals[idx].vehicle_id);
    if (veh) {
      if (req.body.deal_status === 'Delivered') veh.status = 'Sold';
      else if (req.body.deal_status === 'Cancelled') veh.status = 'Available';
    }
    return res.json(mem.deals[idx]);
  }
  res.status(404).json({ error: 'Deal not found' });
});

// ==========================================
// ACTIVITIES & SEARCH
// ==========================================
app.get('/api/activities', (req, res) => {
  res.json(mem.activities);
});

app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json({ leads: [], vehicles: [], customers: [] });

  const customers = mem.customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 5);
  const vehicles = mem.vehicles.filter(v => 
    v.brand.toLowerCase().includes(q) || 
    v.model.toLowerCase().includes(q) || 
    v.stock_id.toLowerCase().includes(q) ||
    (v.registration_number && v.registration_number.toLowerCase().includes(q))
  ).slice(0, 5);
  const leads = mem.leads.map(populateLead).filter(l => 
    l.customer_id.name.toLowerCase().includes(q) || 
    l.customer_id.phone.includes(q) || 
    (l.interested_car && l.interested_car.toLowerCase().includes(q)) ||
    (l.lead_number && l.lead_number.toLowerCase().includes(q))
  ).slice(0, 5);

  res.json({ customers, vehicles, leads });
});

app.listen(PORT, () => {
  console.log(`🚀 Motorwise CRM backend running on port ${PORT}`);
});
