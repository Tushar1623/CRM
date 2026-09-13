require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Models
const User = require('./models/User');
const Customer = require('./models/Customer');
const Vehicle = require('./models/Vehicle');
const Lead = require('./models/Lead');
const FollowUp = require('./models/FollowUp');
const TestDrive = require('./models/TestDrive');
const Deal = require('./models/Deal');
const Activity = require('./models/Activity');

// Utilities & Services
const { normalizePhone } = require('./utils/normalizePhone');
const { generateLeadNumber, generateDealNumber, generateStockId } = require('./utils/generators');
const { logActivity } = require('./services/activity.service');
const { authenticateToken, optionalAuth, JWT_SECRET } = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

let isMongoConnected = false;

// Attempt MongoDB Connection
if (MONGO_URI) {
  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(async () => {
      isMongoConnected = true;
      console.log('✅ Connected to MongoDB Atlas (Production Data Store)');
      await initDefaultAdmin();
    })
    .catch(err => {
      console.warn('⚠️ MongoDB Atlas connection error:', err.message);
      console.warn('👉 Please ensure your IP address is whitelisted on MongoDB Atlas Network Access.');
    });

  mongoose.connection.on('connected', async () => {
    isMongoConnected = true;
    await initDefaultAdmin();
  });
  mongoose.connection.on('disconnected', () => {
    isMongoConnected = false;
  });
}

// Database connectivity guard middleware
function requireDatabase(req, res, next) {
  if (!isMongoConnected && mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database temporarily unavailable. Please verify MongoDB Atlas connection / IP whitelist.'
    });
  }
  next();
}

// Initialize default admin user if none exists in MongoDB
async function initDefaultAdmin() {
  try {
    const adminExists = await User.findOne({ email: 'admin@motorwise.com' });
    if (!adminExists) {
      const hash = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Amit Sharma',
        email: 'admin@motorwise.com',
        phone: '9876543210',
        password_hash: hash,
        role: 'admin',
        status: 'active'
      });
      console.log('👑 Initialized default admin account: admin@motorwise.com / password123');
    }
  } catch (error) {
    console.warn('Could not auto-seed admin user:', error.message);
  }
}

// Helper to get default staff user ID for assignments
async function getDefaultUserId(req) {
  if (req?.user?.id && mongoose.Types.ObjectId.isValid(req.user.id)) {
    return req.user.id;
  }
  const defaultUser = await User.findOne({ role: { $in: ['admin', 'manager', 'sales_executive'] } });
  return defaultUser?._id;
}

// Enum conversion helper to ensure standard lowercase_snake_case
function toSnake(str, defaultVal = '') {
  if (!str) return defaultVal;
  return str.toString().trim().toLowerCase().replace(/[\s\-\/]+/g, '_');
}

// ==========================================
// 1. DATA WIPER (DEVELOPMENT ONLY)
// ==========================================
app.post('/api/clear-data', requireDatabase, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Database clearing is disabled in production environments.' });
  }

  try {
    await Promise.all([
      Customer.deleteMany({}),
      Vehicle.deleteMany({}),
      Lead.deleteMany({}),
      TestDrive.deleteMany({}),
      Deal.deleteMany({}),
      Activity.deleteMany({}),
      FollowUp.deleteMany({})
    ]);

    console.log('🧹 MongoDB database wiped clean of all records.');
    res.json({ message: 'All CRM records successfully cleared!' });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({ error: 'Failed to clear database' });
  }
});

// ==========================================
// 2. AUTHENTICATION & USERS
// ==========================================
app.post('/api/auth/login', requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials. Use admin@motorwise.com / password123' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials. Check your password.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during authentication' });
  }
});

app.post('/api/auth/register', requireDatabase, async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const validRole = ['admin', 'manager', 'sales_executive'].includes(toSnake(role))
      ? toSnake(role)
      : 'sales_executive';

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? normalizePhone(phone) : '',
      password_hash: hash,
      role: validRole,
      status: 'active'
    });

    res.status(201).json({ message: 'User registered successfully', id: newUser._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', requireDatabase, async (req, res) => {
  try {
    const users = await User.find().select('-password_hash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// ==========================================
// 3. STATS & DASHBOARD
// ==========================================
app.get('/api/stats', requireDatabase, async (req, res) => {
  try {
    const [
      totalLeads,
      carsAvailable,
      carsSold,
      testDrivesToday,
      followupsToday,
      deals,
      allLeads
    ] = await Promise.all([
      Lead.countDocuments(),
      Vehicle.countDocuments({ status: { $in: ['available', 'Available'] } }),
      Vehicle.countDocuments({ status: { $in: ['sold', 'Sold'] } }),
      TestDrive.countDocuments({ status: { $in: ['scheduled', 'Scheduled'] } }),
      FollowUp.countDocuments({ status: { $in: ['pending', 'Pending'] } }),
      Deal.find({ status: { $in: ['booked', 'delivered', 'payment_completed', 'Booked', 'Delivered'] } }),
      Lead.find().select('status')
    ]);

    const monthlySales = deals.reduce((sum, d) => sum + (d.final_selling_price || d.selling_price || 0), 0);

    const pipelineCounts = {
      New: allLeads.filter(l => ['new', 'New Lead'].includes(l.status)).length,
      Contacted: allLeads.filter(l => ['contacted', 'Contacted'].includes(l.status)).length,
      Interested: allLeads.filter(l => ['interested', 'Interested'].includes(l.status)).length,
      'Test drive': allLeads.filter(l => ['test_drive', 'Test Drive Scheduled'].includes(l.status)).length,
      Negotiation: allLeads.filter(l => ['negotiation', 'Negotiation'].includes(l.status)).length,
      Booked: allLeads.filter(l => ['booked', 'Booking'].includes(l.status)).length,
      Won: allLeads.filter(l => ['won', 'Sold / Won'].includes(l.status)).length
    };

    const conversionRate = totalLeads > 0 
      ? `${Math.round(((pipelineCounts.Won + pipelineCounts.Booked) / totalLeads) * 100)}%` 
      : '—';

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

app.get('/api/actions/today', requireDatabase, async (req, res) => {
  try {
    const pendingFollowups = await FollowUp.find({ status: { $in: ['pending', 'Pending'] } })
      .populate('customer_id')
      .populate('lead_id')
      .sort({ scheduled_at: 1 })
      .limit(6);

    const actions = pendingFollowups.map((f, idx) => {
      const times = ['10:30 AM', '12:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];
      return {
        id: f._id,
        time: f.scheduled_at 
          ? new Date(f.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          : times[idx % times.length],
        name: f.customer_id?.name || 'Customer',
        phone: f.customer_id?.phone || '',
        action: f.type,
        car: f.lead_id?.interested_car || 'Vehicle',
        priority: f.lead_id?.priority || 'warm',
        lead_id: f.lead_id?._id
      };
    });

    res.json(actions);
  } catch (error) {
    console.error('Actions today error:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// ==========================================
// 4. VEHICLES (INVENTORY)
// ==========================================
app.get('/api/vehicles', requireDatabase, async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      const snakeStatus = toSnake(status);
      query.status = { $in: [snakeStatus, status] };
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { brand: regex },
        { model: regex },
        { stock_id: regex },
        { registration_number: regex }
      ];
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

app.get('/api/vehicles/:id', requireDatabase, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

app.post('/api/vehicles', requireDatabase, async (req, res) => {
  try {
    const body = req.body;
    const askingPrice = Number(body.asking_price || body.selling_price || 0);

    const vehicle = new Vehicle({
      stock_id: (body.stock_id || generateStockId()).toUpperCase().trim(),
      registration_number: body.registration_number ? body.registration_number.toUpperCase().trim() : undefined,
      brand: body.brand || 'Hyundai',
      model: body.model || 'Car',
      variant: body.variant || '',
      manufacturing_year: Number(body.manufacturing_year || body.year || 2022),
      registration_year: body.registration_year ? Number(body.registration_year) : undefined,
      fuel_type: toSnake(body.fuel_type || body.fuel || 'petrol'),
      transmission: toSnake(body.transmission || 'manual'),
      body_type: toSnake(body.body_type || 'suv'),
      km_driven: Number(body.km_driven || 0),
      owners: Number(body.owners || 1),
      colour: body.colour || '',
      registration_city: body.registration_city || '',
      insurance_valid_until: body.insurance_valid_until ? new Date(body.insurance_valid_until) : undefined,
      purchase_price: Number(body.purchase_price || 0),
      asking_price: askingPrice,
      minimum_selling_price: Number(body.minimum_selling_price || 0),
      purchase_date: body.purchase_date ? new Date(body.purchase_date) : undefined,
      location: body.location || 'Main Showroom',
      status: toSnake(body.status || 'available'),
      images: Array.isArray(body.images) ? body.images : [],
      notes: body.notes || ''
    });

    const saved = await vehicle.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/vehicles/:id', requireDatabase, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status) updates.status = toSnake(updates.status);
    if (updates.fuel) updates.fuel_type = toSnake(updates.fuel);
    if (updates.year) updates.manufacturing_year = Number(updates.year);
    if (updates.selling_price) updates.asking_price = Number(updates.selling_price);

    const updated = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:id', requireDatabase, async (req, res) => {
  try {
    const deleted = await Vehicle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// ==========================================
// 5. CUSTOMERS
// ==========================================
app.get('/api/customers', requireDatabase, async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { phone: regex },
        { city: regex }
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    // Populate lead and deal counts for each customer
    const results = await Promise.all(customers.map(async (c) => {
      const [leadsCount, dealsCount] = await Promise.all([
        Lead.countDocuments({ customer_id: c._id }),
        Deal.countDocuments({ customer_id: c._id })
      ]);
      return {
        ...c.toObject(),
        leadsCount,
        dealsCount
      };
    }));

    res.json(results);
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', requireDatabase, async (req, res) => {
  try {
    const { name, phone, email, city, address, area, notes, tags } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    const normalized = normalizePhone(phone);
    let customer = await Customer.findOne({ phone: normalized });

    if (customer) {
      // Update existing customer
      customer.name = name || customer.name;
      customer.email = email || customer.email;
      customer.city = city || customer.city;
      customer.address = address || customer.address;
      customer.area = area || customer.area;
      customer.notes = notes || customer.notes;
      await customer.save();
      return res.json(customer);
    }

    customer = await Customer.create({
      name: name.trim(),
      phone: normalized,
      email: email ? email.toLowerCase().trim() : undefined,
      city: city || '',
      area: area || '',
      address: address || '',
      notes: notes || '',
      tags: Array.isArray(tags) ? tags : [],
      status: 'active'
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 6. LEADS
// ==========================================
app.get('/api/leads', requireDatabase, async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      const snakeStatus = toSnake(status);
      query.status = { $in: [snakeStatus, status] };
    }

    let leads = await Lead.find(query)
      .populate('customer_id')
      .populate('assigned_to', 'name email role')
      .populate('interested_vehicle_ids')
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      leads = leads.filter(l => 
        (l.customer_id?.name && l.customer_id.name.toLowerCase().includes(s)) ||
        (l.customer_id?.phone && l.customer_id.phone.includes(s)) ||
        (l.interested_car && l.interested_car.toLowerCase().includes(s)) ||
        (l.lead_number && l.lead_number.toLowerCase().includes(s))
      );
    }

    res.json(leads);
  } catch (error) {
    console.error('Fetch leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.get('/api/leads/:id', requireDatabase, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('customer_id')
      .populate('assigned_to', 'name email role')
      .populate('interested_vehicle_ids');

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const [activities, followups, testDrives, deals] = await Promise.all([
      Activity.find({ $or: [{ lead_id: lead._id }, { customer_id: lead.customer_id?._id }] })
        .populate('user_id', 'name')
        .sort({ createdAt: -1 }),
      FollowUp.find({ lead_id: lead._id }).sort({ scheduled_at: 1 }),
      TestDrive.find({ lead_id: lead._id }).populate('vehicle_id').populate('employee_id', 'name'),
      Deal.find({ lead_id: lead._id }).populate('vehicle_id').populate('salesperson_id', 'name')
    ]);

    res.json({
      lead,
      activities,
      followups,
      testDrives,
      deals
    });
  } catch (error) {
    console.error('Fetch lead detail error:', error);
    res.status(500).json({ error: 'Failed to fetch lead details' });
  }
});

app.post('/api/leads', requireDatabase, optionalAuth, async (req, res) => {
  try {
    const { 
      name, phone, email, source, priority, interested_car, 
      budget_max, buying_timeline, assigned_to, requirements, notes 
    } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is required' });
    }

    // Step 1: Customer Duplicate Protection & Normalization
    const normalizedPhone = normalizePhone(phone);
    let customer = await Customer.findOne({ phone: normalizedPhone });

    if (!customer) {
      customer = await Customer.create({
        name: name ? name.trim() : 'Customer',
        phone: normalizedPhone,
        email: email ? email.toLowerCase().trim() : undefined,
        status: 'active'
      });
    }

    // Step 2: Determine Assigned User
    let assignedUserId = assigned_to;
    if (!assignedUserId || !mongoose.Types.ObjectId.isValid(assignedUserId)) {
      assignedUserId = await getDefaultUserId(req);
    }

    // Step 3: Create Lead Record
    const leadNumber = generateLeadNumber();
    const leadPriority = ['hot', 'warm', 'cold'].includes(toSnake(priority)) ? toSnake(priority) : 'warm';
    const leadSource = toSnake(source || 'walk_in');

    const newLead = await Lead.create({
      lead_number: leadNumber,
      customer_id: customer._id,
      assigned_to: assignedUserId,
      source: leadSource,
      priority: leadPriority,
      interested_car: interested_car || 'Vehicle',
      requirements: {
        budget_max: budget_max ? Number(budget_max) : 800000,
        buying_timeline: toSnake(buying_timeline || 'within_30_days'),
        ...(requirements || {})
      },
      status: 'new',
      notes: notes || ''
    });

    // Step 4: Auto-log Activity
    await logActivity({
      lead_id: newLead._id,
      customer_id: customer._id,
      user_id: assignedUserId,
      activity_type: 'lead_created',
      title: `New Lead Created (${leadNumber})`,
      description: `Lead created for ${customer.name}. Interested in ${newLead.interested_car}. Budget: ₹${((newLead.requirements.budget_max || 0)/100000).toFixed(1)}L`,
      metadata: { lead_number: leadNumber, source: leadSource }
    });

    // Step 5: Schedule Initial Follow-up Action
    await FollowUp.create({
      lead_id: newLead._id,
      customer_id: customer._id,
      assigned_to: assignedUserId,
      scheduled_at: new Date(Date.now() + 86400000), // +24 hours
      type: 'call',
      notes: `Initial qualification call for ${customer.name}`,
      status: 'pending'
    });

    const populated = await Lead.findById(newLead._id)
      .populate('customer_id')
      .populate('assigned_to', 'name email role');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/leads/:id', requireDatabase, optionalAuth, async (req, res) => {
  try {
    const existing = await Lead.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Lead not found' });

    const updates = { ...req.body };
    if (updates.status) updates.status = toSnake(updates.status);
    if (updates.priority) updates.priority = toSnake(updates.priority);

    // Lost lead workflow: Require lost reason
    if (updates.status === 'lost') {
      if (!updates.lost_reason && !existing.lost_reason) {
        updates.lost_reason = 'other';
      }
      updates.closed_at = new Date();
    } else if (updates.status === 'won') {
      updates.closed_at = new Date();
    }

    const updated = await Lead.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('customer_id')
      .populate('assigned_to', 'name email role');

    // Audit stage changes in Activity collection
    if (updates.status && updates.status !== existing.status) {
      await logActivity({
        lead_id: updated._id,
        customer_id: updated.customer_id?._id,
        user_id: await getDefaultUserId(req),
        activity_type: 'stage_changed',
        title: `Stage Changed to ${updates.status.toUpperCase()}`,
        description: `Lead transitioned from "${existing.status}" to "${updates.status}"`,
        metadata: { from: existing.status, to: updates.status }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/leads/:id', requireDatabase, async (req, res) => {
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
app.get('/api/followups', requireDatabase, async (req, res) => {
  try {
    const { filter } = req.query;
    const query = {};

    if (filter === 'pending') {
      query.status = { $in: ['pending', 'Pending'] };
    }

    const followups = await FollowUp.find(query)
      .populate({
        path: 'lead_id',
        populate: { path: 'customer_id' }
      })
      .populate('customer_id')
      .populate('assigned_to', 'name email')
      .sort({ scheduled_at: 1 });

    res.json(followups);
  } catch (error) {
    console.error('Fetch followups error:', error);
    res.status(500).json({ error: 'Failed to fetch followups' });
  }
});

app.post('/api/followups', requireDatabase, optionalAuth, async (req, res) => {
  try {
    const { lead_id, customer_id, customer_name, customer_phone, scheduled_at, type, notes, assigned_to } = req.body;

    let targetCustomerId = customer_id;
    if (!targetCustomerId && lead_id && mongoose.Types.ObjectId.isValid(lead_id)) {
      const lead = await Lead.findById(lead_id);
      if (lead) targetCustomerId = lead.customer_id;
    }

    if (!targetCustomerId && customer_phone) {
      const normalized = normalizePhone(customer_phone);
      let cust = await Customer.findOne({ phone: normalized });
      if (!cust) {
        cust = await Customer.create({
          name: customer_name || 'Customer',
          phone: normalized,
          status: 'active'
        });
      }
      targetCustomerId = cust._id;
    }

    let assignedUserId = assigned_to;
    if (!assignedUserId || !mongoose.Types.ObjectId.isValid(assignedUserId)) {
      assignedUserId = await getDefaultUserId(req);
    }

    const newFu = await FollowUp.create({
      lead_id: (lead_id && mongoose.Types.ObjectId.isValid(lead_id)) ? lead_id : undefined,
      customer_id: targetCustomerId,
      assigned_to: assignedUserId,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : new Date(),
      type: toSnake(type || 'call'),
      notes: notes || 'Routine follow-up',
      status: 'pending'
    });

    if (newFu.lead_id) {
      await logActivity({
        lead_id: newFu.lead_id,
        customer_id: targetCustomerId,
        user_id: assignedUserId,
        activity_type: 'followup_created',
        title: `Follow-up Scheduled (${newFu.type.toUpperCase()})`,
        description: `Follow-up scheduled for ${new Date(newFu.scheduled_at).toLocaleDateString()}: ${newFu.notes}`
      });
    }

    const populated = await FollowUp.findById(newFu._id)
      .populate('customer_id')
      .populate('lead_id')
      .populate('assigned_to', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create followup error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/followups/:id', requireDatabase, optionalAuth, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status) updates.status = toSnake(updates.status);
    if (updates.status === 'completed') updates.completed_at = new Date();

    const updated = await FollowUp.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('customer_id')
      .populate('lead_id');

    if (!updated) return res.status(404).json({ error: 'Follow-up not found' });

    if (updates.status === 'completed') {
      await logActivity({
        lead_id: updated.lead_id?._id,
        customer_id: updated.customer_id?._id,
        user_id: await getDefaultUserId(req),
        activity_type: 'followup_completed',
        title: 'Follow-up Completed',
        description: `Follow-up completed. Outcome: ${updated.outcome || 'N/A'}`
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 8. TEST DRIVES
// ==========================================
app.get('/api/test-drives', requireDatabase, async (req, res) => {
  try {
    const testDrives = await TestDrive.find()
      .populate('customer_id')
      .populate('vehicle_id')
      .populate('employee_id', 'name email')
      .populate('lead_id')
      .sort({ scheduled_at: -1 });

    res.json(testDrives);
  } catch (error) {
    console.error('Fetch test drives error:', error);
    res.status(500).json({ error: 'Failed to fetch test drives' });
  }
});

app.post('/api/test-drives', requireDatabase, optionalAuth, async (req, res) => {
  try {
    let { 
      customer_id, vehicle_id, lead_id, scheduled_at, date, time, 
      location, customer_name, customer_phone, car_name, employee_id 
    } = req.body;

    // Resolve Customer
    if (!customer_id && customer_phone) {
      const normalized = normalizePhone(customer_phone);
      let cust = await Customer.findOne({ phone: normalized });
      if (!cust) {
        cust = await Customer.create({
          name: customer_name || 'Customer',
          phone: normalized,
          status: 'active'
        });
      }
      customer_id = cust._id;
    }

    // Resolve Vehicle
    if (!vehicle_id && car_name) {
      const parts = car_name.trim().split(' ');
      let veh = await Vehicle.findOne({ brand: new RegExp(parts[0], 'i') });
      if (!veh) {
        veh = await Vehicle.create({
          stock_id: generateStockId(),
          brand: parts[0] || 'Showroom',
          model: parts.slice(1).join(' ') || 'Car',
          manufacturing_year: 2022,
          fuel_type: 'petrol',
          transmission: 'manual',
          body_type: 'suv',
          km_driven: 25000,
          asking_price: 650000,
          status: 'available'
        });
      }
      vehicle_id = veh._id;
    } else if (!vehicle_id) {
      const firstVeh = await Vehicle.findOne();
      vehicle_id = firstVeh?._id;
    }

    if (!vehicle_id || !customer_id) {
      return res.status(400).json({ error: 'Customer and vehicle are required to schedule a test drive' });
    }

    // Unify Date and Time into scheduled_at Date object
    let finalScheduledAt = scheduled_at ? new Date(scheduled_at) : null;
    if (!finalScheduledAt || isNaN(finalScheduledAt)) {
      if (date) {
        finalScheduledAt = new Date(date);
      } else {
        finalScheduledAt = new Date();
      }
    }

    let assignedEmployeeId = employee_id;
    if (!assignedEmployeeId || !mongoose.Types.ObjectId.isValid(assignedEmployeeId)) {
      assignedEmployeeId = await getDefaultUserId(req);
    }

    const testDrive = await TestDrive.create({
      lead_id: (lead_id && mongoose.Types.ObjectId.isValid(lead_id)) ? lead_id : undefined,
      customer_id,
      vehicle_id,
      employee_id: assignedEmployeeId,
      scheduled_at: finalScheduledAt,
      location: location || 'Showroom',
      status: 'scheduled'
    });

    // Relational progression: Update lead stage to test_drive
    if (lead_id && mongoose.Types.ObjectId.isValid(lead_id)) {
      await Lead.findByIdAndUpdate(lead_id, { status: 'test_drive' });
      await logActivity({
        lead_id,
        customer_id,
        user_id: assignedEmployeeId,
        activity_type: 'test_drive_created',
        title: 'Test Drive Scheduled',
        description: `Test drive scheduled for ${finalScheduledAt.toLocaleString('en-IN')}`
      });
    }

    const populated = await TestDrive.findById(testDrive._id)
      .populate('customer_id')
      .populate('vehicle_id')
      .populate('employee_id', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create test drive error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/test-drives/:id', requireDatabase, optionalAuth, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status) updates.status = toSnake(updates.status);
    if (updates.status === 'completed') updates.completed_at = new Date();

    const updated = await TestDrive.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('customer_id')
      .populate('vehicle_id');

    if (!updated) return res.status(404).json({ error: 'Test drive not found' });

    if (updates.status === 'completed') {
      await logActivity({
        lead_id: updated.lead_id,
        customer_id: updated.customer_id?._id,
        user_id: await getDefaultUserId(req),
        activity_type: 'test_drive_completed',
        title: 'Test Drive Completed',
        description: `Test drive completed. Result: ${updated.result || 'interested'}`
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 9. DEALS (BUSINESS INTEGRITY WORKFLOWS)
// ==========================================
app.get('/api/deals', requireDatabase, async (req, res) => {
  try {
    const deals = await Deal.find()
      .populate('customer_id')
      .populate('vehicle_id')
      .populate('salesperson_id', 'name email')
      .populate('lead_id')
      .sort({ createdAt: -1 });

    res.json(deals);
  } catch (error) {
    console.error('Fetch deals error:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

app.post('/api/deals', requireDatabase, optionalAuth, async (req, res) => {
  try {
    let { 
      customer_id, vehicle_id, lead_id, selling_price, final_selling_price, 
      booking_amount, deal_status, status, payment_method, finance_status, 
      customer_name, customer_phone, salesperson_id 
    } = req.body;

    // Resolve Customer
    if (!customer_id && customer_phone) {
      const normalized = normalizePhone(customer_phone);
      let cust = await Customer.findOne({ phone: normalized });
      if (!cust) {
        cust = await Customer.create({
          name: customer_name || 'Customer',
          phone: normalized,
          status: 'active'
        });
      }
      customer_id = cust._id;
    }

    if (!vehicle_id || !mongoose.Types.ObjectId.isValid(vehicle_id)) {
      return res.status(400).json({ error: 'Valid Vehicle ID is required to create a deal' });
    }

    // Vehicle Booking Integrity Rule (Section 18)
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (['sold', 'booked', 'reserved'].includes(vehicle.status)) {
      return res.status(400).json({
        error: `Vehicle ${vehicle.brand} ${vehicle.model} (${vehicle.stock_id}) is currently ${vehicle.status} and cannot be booked.`
      });
    }

    let staffId = salesperson_id;
    if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
      staffId = await getDefaultUserId(req);
    }

    const finalPrice = Number(final_selling_price || selling_price || vehicle.asking_price || 0);
    const tokenAmount = Number(booking_amount || 0);
    const cleanStatus = toSnake(status || deal_status || 'booked');

    const newDeal = await Deal.create({
      deal_number: generateDealNumber(),
      lead_id: (lead_id && mongoose.Types.ObjectId.isValid(lead_id)) ? lead_id : undefined,
      customer_id,
      vehicle_id: vehicle._id,
      salesperson_id: staffId,
      asking_price: vehicle.asking_price || finalPrice,
      final_selling_price: finalPrice,
      booking_amount: tokenAmount,
      amount_received: tokenAmount,
      payment_method: toSnake(payment_method || 'upi'),
      payment_status: tokenAmount >= finalPrice ? 'paid' : (tokenAmount > 0 ? 'partial' : 'pending'),
      finance_status: toSnake(finance_status || 'not_applicable'),
      status: cleanStatus,
      booking_date: new Date()
    });

    // Transactional Business Update: Mark Vehicle Reserved / Booked
    vehicle.status = 'booked';
    await vehicle.save();

    // Transactional Business Update: Mark Lead as Booked
    if (lead_id && mongoose.Types.ObjectId.isValid(lead_id)) {
      await Lead.findByIdAndUpdate(lead_id, { status: 'booked' });
      await logActivity({
        lead_id,
        customer_id,
        user_id: staffId,
        activity_type: 'deal_created',
        title: `Deal Created (${newDeal.deal_number})`,
        description: `Deal created for ${vehicle.brand} ${vehicle.model}. Price: ₹${(finalPrice/100000).toFixed(2)}L, Token: ₹${tokenAmount.toLocaleString()}`,
        metadata: { deal_number: newDeal.deal_number, final_selling_price: finalPrice }
      });
    }

    const populated = await Deal.findById(newDeal._id)
      .populate('customer_id')
      .populate('vehicle_id')
      .populate('salesperson_id', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/deals/:id', requireDatabase, optionalAuth, async (req, res) => {
  try {
    const existing = await Deal.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Deal not found' });

    const updates = { ...req.body };
    const targetStatus = toSnake(updates.status || updates.deal_status);
    if (targetStatus) updates.status = targetStatus;

    // Delivery Workflow (Section 19)
    if (targetStatus === 'delivered') {
      updates.status = 'delivered';
      updates.payment_status = 'paid';
      updates.delivered_at = new Date();

      // Mark vehicle as SOLD
      await Vehicle.findByIdAndUpdate(existing.vehicle_id, {
        status: 'sold',
        sold_at: new Date()
      });

      // Mark lead as WON
      if (existing.lead_id) {
        await Lead.findByIdAndUpdate(existing.lead_id, {
          status: 'won',
          closed_at: new Date()
        });
      }

      await logActivity({
        lead_id: existing.lead_id,
        customer_id: existing.customer_id,
        user_id: await getDefaultUserId(req),
        activity_type: 'vehicle_sold',
        title: 'Vehicle Delivered & Sold',
        description: `Deal ${existing.deal_number} marked delivered. Vehicle marked SOLD and lead closed as WON.`
      });
    }

    // Cancellation Workflow (Section 20)
    else if (targetStatus === 'cancelled') {
      updates.status = 'cancelled';

      // Release vehicle back to AVAILABLE
      await Vehicle.findByIdAndUpdate(existing.vehicle_id, {
        status: 'available'
      });

      // Reopen lead back to negotiation / follow_up
      if (existing.lead_id) {
        await Lead.findByIdAndUpdate(existing.lead_id, {
          status: 'negotiation'
        });
      }

      await logActivity({
        lead_id: existing.lead_id,
        customer_id: existing.customer_id,
        user_id: await getDefaultUserId(req),
        activity_type: 'deal_status_changed',
        title: 'Deal Cancelled',
        description: `Deal ${existing.deal_number} cancelled. Vehicle inventory released back to Available.`
      });
    }

    const updated = await Deal.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('customer_id')
      .populate('vehicle_id')
      .populate('salesperson_id', 'name email');

    res.json(updated);
  } catch (error) {
    console.error('Update deal error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 10. ACTIVITIES & SEARCH
// ==========================================
app.get('/api/activities', requireDatabase, async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('lead_id', 'lead_number interested_car')
      .populate('customer_id', 'name phone')
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 })
      .limit(60);

    res.json(activities);
  } catch (error) {
    console.error('Fetch activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.get('/api/search', requireDatabase, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ customers: [], vehicles: [], leads: [] });

    const regex = new RegExp(q, 'i');

    const [customers, vehicles, leads] = await Promise.all([
      Customer.find({ $or: [{ name: regex }, { phone: regex }] }).limit(5),
      Vehicle.find({ $or: [{ brand: regex }, { model: regex }, { stock_id: regex }, { registration_number: regex }] }).limit(5),
      Lead.find({ $or: [{ lead_number: regex }, { interested_car: regex }] })
        .populate('customer_id')
        .limit(5)
    ]);

    res.json({ customers, vehicles, leads });
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
  console.log(`📡 Database mode: MongoDB Atlas + Mongoose Persistent Engine`);
});
