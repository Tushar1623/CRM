require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mongoose Models
const Business = require('./models/Business');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Item = require('./models/Item');
const Vehicle = require('./models/Vehicle'); // Alias of Item
const Lead = require('./models/Lead');
const FollowUp = require('./models/FollowUp');
const Appointment = require('./models/Appointment');
const TestDrive = require('./models/TestDrive'); // Alias of Appointment
const Deal = require('./models/Deal');
const Activity = require('./models/Activity');
const { optionalAuth, JWT_SECRET } = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ==========================================
// MONGODB ATLAS DIRECT CONNECTION
// ==========================================
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected directly to MongoDB Atlas');
    await initializeDefaults();
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:', err.message);
  });

// Seed default business, admin and sample inventory if empty
async function initializeDefaults() {
  try {
    let business = await Business.findOne();
    if (!business) {
      business = await Business.create(Business.TEMPLATES.used_car);
      console.log('🏢 Initial business template created: Used Car Dealership');
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const password_hash = await bcrypt.hash('password123', 10);
      await User.create({
        business_id: business._id,
        name: 'Amit Sharma',
        email: 'admin@motorwise.com',
        phone: '9876543210',
        password_hash,
        role: 'admin',
        status: 'active'
      });
      console.log('👤 Default admin user seeded: admin@motorwise.com / password123');
    }

    const itemCount = await Item.countDocuments();
    if (itemCount === 0) {
      await Item.insertMany([
        {
          business_id: business._id,
          stock_id: 'STK-2026-001',
          code: 'STK-2026-001',
          name: 'Hyundai Creta SX(O)',
          brand: 'Hyundai',
          model: 'Creta SX(O)',
          category: 'SUV',
          year: 2022,
          fuel: 'Petrol',
          transmission: 'Manual',
          km_driven: 28000,
          price: 1150000,
          selling_price: 1150000,
          status: 'Available',
          description: 'Single owner, pristine condition with complete service record'
        },
        {
          business_id: business._id,
          stock_id: 'STK-2026-002',
          code: 'STK-2026-002',
          name: 'Honda City ZX',
          brand: 'Honda',
          model: 'City ZX',
          category: 'Sedan',
          year: 2021,
          fuel: 'Petrol',
          transmission: 'Automatic',
          km_driven: 32000,
          price: 980000,
          selling_price: 980000,
          status: 'Available',
          description: 'Full dealership service history, sunroof, leather seats'
        }
      ]);
      console.log('📦 Initial inventory seeded into MongoDB Atlas');
    }
  } catch (err) {
    console.error('Initialization note:', err.message);
  }
}

// Helper: Normalize 10-digit Indian phone
function cleanPhone(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/[^0-9]/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

// ==========================================
// 1. BUSINESS CONFIGURATION & TEMPLATES
// ==========================================
app.get('/api/business/current', async (req, res) => {
  try {
    let business = await Business.findOne();
    if (!business) {
      business = await Business.create(Business.TEMPLATES.used_car);
    }
    res.json({
      business,
      available_templates: Business.TEMPLATES
    });
  } catch (error) {
    console.error('Fetch business error:', error);
    res.status(500).json({ error: 'Failed to fetch business configuration' });
  }
});

app.put('/api/business/template', async (req, res) => {
  try {
    const { business_type } = req.body;
    const template = Business.TEMPLATES[business_type];
    if (!template) {
      return res.status(400).json({ error: `Invalid business type: ${business_type}` });
    }

    let business = await Business.findOne();
    if (!business) {
      business = new Business(template);
    } else {
      business.business_type = template.business_type;
      business.name = template.name;
      business.labels = template.labels;
      business.modules = template.modules;
    }
    await business.save();

    console.log(`🔄 Switched active business template to: ${business.business_type}`);
    res.json({
      message: `Switched template to ${business.name}`,
      business
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to switch business template' });
  }
});

// ==========================================
// 2. AUTHENTICATION & USERS
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials. Use admin@motorwise.com / password123' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials. Check your password.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role || 'admin', name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'admin',
        status: user.status || 'active'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password_hash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// ==========================================
// 3. DASHBOARD & STATS
// ==========================================
app.get('/api/stats', async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const carsAvailable = await Item.countDocuments({ status: { $regex: /^available$/i } });
    const carsSold = await Item.countDocuments({ status: { $regex: /^sold$/i } });

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const testDrivesToday = await Appointment.countDocuments({
      scheduled_at: { $gte: todayStart, $lte: todayEnd }
    });

    const followupsToday = await FollowUp.countDocuments({
      scheduled_at: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'Completed' }
    });

    const allDeals = await Deal.find();
    const monthlySales = allDeals.reduce((sum, d) => sum + (d.selling_price || 0), 0);

    const allLeads = await Lead.find();
    const pipelineCounts = {
      New: 0, Contacted: 0, Interested: 0, 'Test drive': 0, Negotiation: 0, Booked: 0, Won: 0
    };

    let wonCount = 0;
    allLeads.forEach(l => {
      const s = (l.status || '').toLowerCase();
      if (s.includes('new')) pipelineCounts.New++;
      else if (s.includes('contact')) pipelineCounts.Contacted++;
      else if (s.includes('interest')) pipelineCounts.Interested++;
      else if (s.includes('test') || s.includes('drive') || s.includes('visit') || s.includes('counsel')) pipelineCounts['Test drive']++;
      else if (s.includes('negot')) pipelineCounts.Negotiation++;
      else if (s.includes('book') || s.includes('admiss')) pipelineCounts.Booked++;
      else if (s.includes('won') || s.includes('sold')) {
        pipelineCounts.Won++;
        wonCount++;
      } else {
        pipelineCounts.New++;
      }
    });

    const conversionRate = totalLeads > 0 ? `${Math.round((wonCount / totalLeads) * 100)}%` : '—';

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
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

app.get('/api/actions/today', async (req, res) => {
  try {
    const followups = await FollowUp.find({
      status: { $ne: 'Completed' }
    }).populate('customer_id').populate('lead_id').sort({ scheduled_at: 1 }).limit(10);

    const actions = followups.map(f => {
      const cust = f.customer_id;
      const lead = f.lead_id;
      const d = new Date(f.scheduled_at);
      return {
        id: f._id,
        name: cust?.name || f.customer_name || 'Customer',
        phone: cust?.phone || f.customer_phone || '',
        action: f.type || 'Call',
        car: lead?.interested_car || lead?.title || 'Enquiry',
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        priority: lead?.priority || 'Warm'
      };
    });

    res.json(actions);
  } catch (error) {
    console.error('Actions error:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// ==========================================
// 4. ITEMS / INVENTORY / VEHICLES
// ==========================================
const handleGetItems = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = new RegExp(`^${status}$`, 'i');
    }

    if (search) {
      const reg = new RegExp(search, 'i');
      query.$or = [{ name: reg }, { brand: reg }, { model: reg }, { code: reg }, { stock_id: reg }];
    }

    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Fetch items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

const handleCreateItem = async (req, res) => {
  try {
    const count = await Item.countDocuments();
    const code = req.body.code || req.body.stock_id || `ITM-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    const price = req.body.price || req.body.selling_price || 0;
    const name = req.body.name || (req.body.brand && req.body.model ? `${req.body.brand} ${req.body.model}` : 'New Item');

    const item = await Item.create({
      ...req.body,
      name,
      code,
      stock_id: code,
      price,
      selling_price: price
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(400).json({ error: error.message });
  }
};

app.get('/api/items', handleGetItems);
app.get('/api/vehicles', handleGetItems);

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});
app.get('/api/vehicles/:id', async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(item);
});

app.post('/api/items', handleCreateItem);
app.post('/api/vehicles', handleCreateItem);

app.put('/api/items/:id', async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.put('/api/vehicles/:id', async (req, res) => {
  const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(updated);
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});
app.delete('/api/vehicles/:id', async (req, res) => {
  const deleted = await Item.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
  res.json({ message: 'Vehicle deleted successfully' });
});

// ==========================================
// 5. CUSTOMERS
// ==========================================
app.get('/api/customers', async (req, res) => {
  try {
    const query = {};
    if (req.query.search) {
      const reg = new RegExp(req.query.search, 'i');
      query.$or = [{ name: reg }, { phone: reg }, { email: reg }];
    }
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const phone = cleanPhone(req.body.phone);
    let customer = await Customer.findOne({ phone });
    if (customer) {
      Object.assign(customer, req.body, { phone });
      await customer.save();
    } else {
      customer = await Customer.create({ ...req.body, phone });
    }
    res.status(201).json(customer);
  } catch (error) {
    console.error('Customer error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 6. LEADS
// ==========================================
app.get('/api/leads', async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = new RegExp(status, 'i');
    }

    if (search) {
      const reg = new RegExp(search, 'i');
      query.$or = [
        { interested_car: reg },
        { title: reg },
        { customer_name: reg },
        { customer_phone: reg }
      ];
    }

    const leads = await Lead.find(query)
      .populate('customer_id')
      .populate('assigned_to', 'name email role')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (error) {
    console.error('Fetch leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('customer_id')
      .populate('assigned_to', 'name email role');

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const [activities, followups, testDrives, deals] = await Promise.all([
      Activity.find({ lead_id: lead._id }).sort({ createdAt: -1 }),
      FollowUp.find({ lead_id: lead._id }).populate('customer_id').sort({ scheduled_at: 1 }),
      Appointment.find({ lead_id: lead._id }).populate('item_id').populate('vehicle_id').populate('customer_id').sort({ scheduled_at: 1 }),
      Deal.find({ lead_id: lead._id }).populate('item_id').populate('vehicle_id').populate('customer_id').sort({ createdAt: -1 })
    ]);

    res.json({ lead, activities, followups, testDrives, deals });
  } catch (error) {
    console.error('Fetch lead detail error:', error);
    res.status(500).json({ error: 'Failed to fetch lead details' });
  }
});

app.post('/api/leads', optionalAuth, async (req, res) => {
  try {
    const { name, phone, email, city, interested_car, title, budget_max, source, priority, buying_timeline, assigned_to } = req.body;
    
    const normPhone = cleanPhone(phone) || '9999999999';
    let customer = await Customer.findOne({ phone: normPhone });
    if (!customer) {
      customer = await Customer.create({
        name: name || 'Prospective Client',
        phone: normPhone,
        email: email || '',
        city: city || 'India'
      });
    }

    const count = await Lead.countDocuments();
    const lead_number = `LD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const reqItem = interested_car || title || 'General Requirement';

    const lead = await Lead.create({
      lead_number,
      customer_id: customer._id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      title: reqItem,
      interested_car: reqItem,
      budget_max: Number(budget_max) || 0,
      source: source || 'Direct',
      priority: priority || 'Warm',
      status: 'New Lead',
      buying_timeline: buying_timeline || 'Within 30 Days',
      assigned_to_name: assigned_to || 'Sales Executive'
    });

    await Activity.create({
      lead_id: lead._id,
      customer_id: customer._id,
      activity_type: 'lead_created',
      title: 'Lead Created',
      description: `New enquiry captured for ${lead.interested_car} (Budget: ₹${lead.budget_max?.toLocaleString()})`,
      user: req.user?.name || 'Sales Executive'
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/leads/:id', optionalAuth, async (req, res) => {
  try {
    const oldLead = await Lead.findById(req.params.id);
    if (!oldLead) return res.status(404).json({ error: 'Lead not found' });

    const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (req.body.status && req.body.status !== oldLead.status) {
      await Activity.create({
        lead_id: updated._id,
        customer_id: updated.customer_id,
        activity_type: 'stage_changed',
        title: 'Stage Updated',
        description: `Lead stage changed from ${oldLead.status} to ${req.body.status}`,
        user: req.user?.name || 'Sales Executive'
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// ==========================================
// 7. FOLLOW-UPS
// ==========================================
app.get('/api/followups', async (req, res) => {
  try {
    const { filter } = req.query;
    const query = {};

    if (filter === 'pending') {
      query.status = { $ne: 'Completed' };
    } else if (filter === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      query.scheduled_at = { $gte: start, $lte: end };
    }

    const followups = await FollowUp.find(query)
      .populate('customer_id')
      .populate('lead_id')
      .sort({ scheduled_at: 1 });

    res.json(followups);
  } catch (error) {
    console.error('Fetch followups error:', error);
    res.status(500).json({ error: 'Failed to fetch followups' });
  }
});

app.post('/api/followups', optionalAuth, async (req, res) => {
  try {
    const followup = await FollowUp.create(req.body);

    if (req.body.lead_id) {
      await Activity.create({
        lead_id: req.body.lead_id,
        customer_id: req.body.customer_id,
        activity_type: 'followup_scheduled',
        title: 'Follow-up Scheduled',
        description: `${req.body.type || 'Call'} scheduled for ${new Date(req.body.scheduled_at).toLocaleDateString()}`,
        user: req.user?.name || 'Sales Executive'
      });
    }

    res.status(201).json(followup);
  } catch (error) {
    console.error('Create followup error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/followups/:id', optionalAuth, async (req, res) => {
  try {
    const updated = await FollowUp.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Follow-up not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 8. APPOINTMENTS / TEST DRIVES
// ==========================================
const handleGetAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('customer_id')
      .populate('item_id')
      .populate('vehicle_id')
      .populate('lead_id')
      .sort({ scheduled_at: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Fetch appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

const handleCreateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);

    if (req.body.lead_id) {
      await Activity.create({
        lead_id: req.body.lead_id,
        customer_id: req.body.customer_id,
        activity_type: 'appointment_scheduled',
        title: 'Appointment Booked',
        description: `${appointment.type || 'Appointment'} scheduled for ${req.body.car_name || req.body.item_name || 'Meeting'} on ${req.body.date || 'today'}`,
        user: req.user?.name || 'Sales Executive'
      });

      await Lead.findByIdAndUpdate(req.body.lead_id, { status: 'Appointment Scheduled' });
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(400).json({ error: error.message });
  }
};

app.get('/api/appointments', handleGetAppointments);
app.get('/api/test-drives', handleGetAppointments);

app.post('/api/appointments', optionalAuth, handleCreateAppointment);
app.post('/api/test-drives', optionalAuth, handleCreateAppointment);

app.put('/api/appointments/:id', optionalAuth, async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Appointment not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.put('/api/test-drives/:id', optionalAuth, async (req, res) => {
  const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: 'Test drive not found' });
  res.json(updated);
});

// ==========================================
// 9. DEALS & BOOKINGS
// ==========================================
app.get('/api/deals', async (req, res) => {
  try {
    const deals = await Deal.find()
      .populate('customer_id')
      .populate('item_id')
      .populate('vehicle_id')
      .populate('lead_id')
      .sort({ createdAt: -1 });

    res.json(deals);
  } catch (error) {
    console.error('Fetch deals error:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

app.post('/api/deals', optionalAuth, async (req, res) => {
  try {
    const count = await Deal.countDocuments();
    const deal_number = `DL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const deal = await Deal.create({
      ...req.body,
      deal_number
    });

    const targetItem = req.body.item_id || req.body.vehicle_id;
    if (targetItem) {
      await Item.findByIdAndUpdate(targetItem, { status: 'Reserved' });
    }

    if (req.body.lead_id) {
      await Lead.findByIdAndUpdate(req.body.lead_id, { status: 'Booked' });

      await Activity.create({
        lead_id: req.body.lead_id,
        customer_id: req.body.customer_id,
        activity_type: 'deal_created',
        title: 'Deal Created',
        description: `Deal ${deal_number} created: ₹${deal.selling_price?.toLocaleString()} (Deposit: ₹${deal.booking_amount?.toLocaleString()})`,
        user: req.user?.name || 'Sales Executive'
      });
    }

    res.status(201).json(deal);
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/deals/:id', optionalAuth, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    const newStatus = req.body.deal_status || req.body.status;
    const updated = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });

    const targetItem = deal.item_id || deal.vehicle_id;
    if (newStatus && targetItem) {
      if (newStatus.toLowerCase() === 'delivered' || newStatus.toLowerCase() === 'won' || newStatus.toLowerCase() === 'completed') {
        await Item.findByIdAndUpdate(targetItem, { status: 'Sold' });
        if (deal.lead_id) await Lead.findByIdAndUpdate(deal.lead_id, { status: 'Sold / Won' });
      } else if (newStatus.toLowerCase() === 'cancelled') {
        await Item.findByIdAndUpdate(targetItem, { status: 'Available' });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 10. ACTIVITIES & SEARCH
// ==========================================
app.get('/api/activities', async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(20);
    res.json(activities);
  } catch (error) {
    console.error('Fetch activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ leads: [], vehicles: [], items: [] });

    const reg = new RegExp(q.trim(), 'i');
    const [leads, items] = await Promise.all([
      Lead.find({
        $or: [{ interested_car: reg }, { title: reg }, { customer_name: reg }, { customer_phone: reg }]
      }).limit(5),
      Item.find({
        $or: [{ name: reg }, { brand: reg }, { model: reg }, { code: reg }, { stock_id: reg }]
      }).limit(5)
    ]);

    res.json({ leads, vehicles: items, items });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Motorwise CRM backend running on port ${PORT}`);
  console.log(`🌐 Multi-Business Architecture Active on MongoDB Atlas`);
});
