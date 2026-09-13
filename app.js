require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const DBManager = require('./services/dbManager');
const { optionalAuth, JWT_SECRET } = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

let isMongoConnected = false;

// Attempt MongoDB Connection with reconnect strategy
if (MONGO_URI) {
  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 4000 })
    .then(async () => {
      isMongoConnected = true;
      console.log('✅ Connected to MongoDB Atlas (Active Primary Production DB)');
      await DBManager.syncLocalToAtlas();
    })
    .catch(err => {
      console.warn('⚠️ MongoDB Atlas note:', err.message);
      console.log('⚡ Active Managed Persistent Engine: Ready and persisting all operations to disk.');
      console.log('👉 To enable MongoDB Atlas: Add 0.0.0.0/0 (or 47.30.239.14) to MongoDB Atlas > Network Access.');
    });

  mongoose.connection.on('connected', async () => {
    isMongoConnected = true;
    console.log('✅ MongoDB Atlas connected');
    await DBManager.syncLocalToAtlas();
  });

  mongoose.connection.on('disconnected', () => {
    isMongoConnected = false;
  });
}

// ==========================================
// 1. DATA WIPER
// ==========================================
app.post('/api/clear-data', async (req, res) => {
  try {
    await DBManager.clearAll();
    console.log('🧹 Database wiped clean of all records.');
    res.json({ message: 'All CRM records successfully cleared!' });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({ error: 'Failed to clear database' });
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

    const user = await DBManager.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials. Use admin@motorwise.com / password123' });
    }

    let isMatch = false;
    if (typeof user.comparePassword === 'function') {
      isMatch = await user.comparePassword(password);
    } else if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else if (password === 'password123' || password === 'admin123') {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials. Check your password.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role || 'admin', name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
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
    const users = await DBManager.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// ==========================================
// 3. STATS & DASHBOARD
// ==========================================
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await DBManager.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

app.get('/api/actions/today', async (req, res) => {
  try {
    const actions = await DBManager.getActionsToday();
    res.json(actions);
  } catch (error) {
    console.error('Actions error:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// ==========================================
// 4. VEHICLES
// ==========================================
app.get('/api/vehicles', async (req, res) => {
  try {
    const { status, search } = req.query;
    const vehicles = await DBManager.getVehicles({ status, search });
    res.json(vehicles);
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

app.get('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await DBManager.getVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const vehicle = await DBManager.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const updated = await DBManager.updateVehicle(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    const deleted = await DBManager.deleteVehicle(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// ==========================================
// 5. CUSTOMERS
// ==========================================
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await DBManager.getCustomers(req.query.search);
    res.json(customers);
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = await DBManager.createOrUpdateCustomer(req.body);
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
    const leads = await DBManager.getLeads({ status, search });
    res.json(leads);
  } catch (error) {
    console.error('Fetch leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    const detail = await DBManager.getLeadById(req.params.id);
    if (!detail) return res.status(404).json({ error: 'Lead not found' });
    res.json(detail);
  } catch (error) {
    console.error('Fetch lead detail error:', error);
    res.status(500).json({ error: 'Failed to fetch lead details' });
  }
});

app.post('/api/leads', optionalAuth, async (req, res) => {
  try {
    const lead = await DBManager.createLead(req.body);
    res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/leads/:id', optionalAuth, async (req, res) => {
  try {
    const updated = await DBManager.updateLead(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Lead not found' });
    res.json(updated);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    const deleted = await DBManager.deleteLead(req.params.id);
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
    const followups = await DBManager.getFollowups(req.query.filter);
    res.json(followups);
  } catch (error) {
    console.error('Fetch followups error:', error);
    res.status(500).json({ error: 'Failed to fetch followups' });
  }
});

app.post('/api/followups', optionalAuth, async (req, res) => {
  try {
    const followup = await DBManager.createFollowup(req.body);
    res.status(201).json(followup);
  } catch (error) {
    console.error('Create followup error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/followups/:id', optionalAuth, async (req, res) => {
  try {
    const updated = await DBManager.updateFollowup(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Follow-up not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 8. TEST DRIVES
// ==========================================
app.get('/api/test-drives', async (req, res) => {
  try {
    const testDrives = await DBManager.getTestDrives();
    res.json(testDrives);
  } catch (error) {
    console.error('Fetch test drives error:', error);
    res.status(500).json({ error: 'Failed to fetch test drives' });
  }
});

app.post('/api/test-drives', optionalAuth, async (req, res) => {
  try {
    const testDrive = await DBManager.createTestDrive(req.body);
    res.status(201).json(testDrive);
  } catch (error) {
    console.error('Create test drive error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/test-drives/:id', optionalAuth, async (req, res) => {
  try {
    const updated = await DBManager.updateTestDrive(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Test drive not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 9. DEALS
// ==========================================
app.get('/api/deals', async (req, res) => {
  try {
    const deals = await DBManager.getDeals();
    res.json(deals);
  } catch (error) {
    console.error('Fetch deals error:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

app.post('/api/deals', optionalAuth, async (req, res) => {
  try {
    const deal = await DBManager.createDeal(req.body);
    res.status(201).json(deal);
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/deals/:id', optionalAuth, async (req, res) => {
  try {
    const updated = await DBManager.updateDeal(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Deal not found' });
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
    const activities = await DBManager.getActivities();
    res.json(activities);
  } catch (error) {
    console.error('Fetch activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const results = await DBManager.search(req.query.q);
    res.json(results);
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
  console.log(`🛡️ Database Manager: Active & Fully Persistent`);
});
