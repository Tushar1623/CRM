const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const TestDrive = require('../models/TestDrive');
const Deal = require('../models/Deal');
const Activity = require('../models/Activity');

const { normalizePhone } = require('../utils/normalizePhone');
const { generateLeadNumber, generateDealNumber, generateStockId } = require('../utils/generators');

const DB_FILE = path.join(__dirname, '..', 'data', 'crm_store.json');

// Memory cache loaded from persistent disk file
let diskStore = {
  users: [],
  customers: [],
  vehicles: [],
  leads: [],
  followups: [],
  testDrives: [],
  deals: [],
  activities: []
};

function loadStoreFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(content);
      diskStore = { ...diskStore, ...parsed };
    } else {
      saveStoreToDisk();
    }
  } catch (err) {
    console.error('Error reading persistent database file:', err.message);
  }
}

function saveStoreToDisk() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(diskStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving persistent database file:', err.message);
  }
}

loadStoreFromDisk();

function isAtlasOnline() {
  return mongoose.connection.readyState === 1;
}

function generateId(prefix = 'id') {
  return new mongoose.Types.ObjectId().toString();
}

function toSnake(str, defaultVal = '') {
  if (!str) return defaultVal;
  return str.toString().trim().toLowerCase().replace(/[\s\-\/]+/g, '_');
}

// Ensure admin user exists in diskStore
async function ensureDiskAdmin() {
  const admin = diskStore.users.find(u => u.email === 'admin@motorwise.com');
  if (!admin) {
    const hash = await bcrypt.hash('password123', 10);
    diskStore.users.push({
      _id: 'usr_admin',
      name: 'Amit Sharma',
      email: 'admin@motorwise.com',
      phone: '9876543210',
      password_hash: hash,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString()
    });
    saveStoreToDisk();
  }
}

ensureDiskAdmin();

// ==========================================
// DB MANAGER API
// ==========================================
class DBManager {
  // Sync local data to Atlas if Atlas becomes connected
  static async syncLocalToAtlas() {
    if (!isAtlasOnline()) return;
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0 && diskStore.users.length > 0) {
        console.log('🔄 Syncing local persistent records to MongoDB Atlas...');
        for (const u of diskStore.users) {
          await User.findOneAndUpdate({ email: u.email }, u, { upsert: true });
        }
        for (const c of diskStore.customers) {
          await Customer.findOneAndUpdate({ phone: c.phone }, c, { upsert: true });
        }
        for (const v of diskStore.vehicles) {
          await Vehicle.findOneAndUpdate({ stock_id: v.stock_id }, v, { upsert: true });
        }
        for (const l of diskStore.leads) {
          await Lead.findOneAndUpdate({ lead_number: l.lead_number }, l, { upsert: true });
        }
        for (const d of diskStore.deals) {
          await Deal.findOneAndUpdate({ deal_number: d.deal_number }, d, { upsert: true });
        }
        console.log('✅ Local database records successfully synchronized with MongoDB Atlas!');
      }
    } catch (err) {
      console.warn('Atlas sync note:', err.message);
    }
  }

  // --- USERS ---
  static async findUserByEmail(email) {
    if (isAtlasOnline()) {
      return await User.findOne({ email: email.toLowerCase().trim() });
    }
    return diskStore.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  static async getUsers() {
    if (isAtlasOnline()) {
      return await User.find().select('-password_hash');
    }
    return diskStore.users.map(({ password_hash, ...rest }) => rest);
  }

  // --- STATS ---
  static async getStats() {
    if (isAtlasOnline()) {
      const [
        totalLeads, carsAvailable, carsSold, testDrivesToday,
        followupsToday, deals, allLeads
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

      return {
        totalLeads, carsAvailable, carsSold, testDrivesToday, followupsToday, monthlySales,
        conversionRate: totalLeads > 0 ? `${Math.round(((pipelineCounts.Won + pipelineCounts.Booked) / totalLeads) * 100)}%` : '—',
        pipelineCounts
      };
    }

    // Disk Store stats
    const totalLeads = diskStore.leads.length;
    const carsAvailable = diskStore.vehicles.filter(v => ['available', 'Available'].includes(v.status)).length;
    const carsSold = diskStore.vehicles.filter(v => ['sold', 'Sold'].includes(v.status)).length;
    const testDrivesToday = diskStore.testDrives.filter(t => ['scheduled', 'Scheduled'].includes(t.status)).length;
    const followupsToday = diskStore.followups.filter(f => ['pending', 'Pending'].includes(f.status)).length;
    const monthlySales = diskStore.deals.reduce((sum, d) => sum + (d.final_selling_price || d.selling_price || 0), 0);

    const pipelineCounts = {
      New: diskStore.leads.filter(l => ['new', 'New Lead'].includes(l.status)).length,
      Contacted: diskStore.leads.filter(l => ['contacted', 'Contacted'].includes(l.status)).length,
      Interested: diskStore.leads.filter(l => ['interested', 'Interested'].includes(l.status)).length,
      'Test drive': diskStore.leads.filter(l => ['test_drive', 'Test Drive Scheduled'].includes(l.status)).length,
      Negotiation: diskStore.leads.filter(l => ['negotiation', 'Negotiation'].includes(l.status)).length,
      Booked: diskStore.leads.filter(l => ['booked', 'Booking'].includes(l.status)).length,
      Won: diskStore.leads.filter(l => ['won', 'Sold / Won'].includes(l.status)).length
    };

    return {
      totalLeads, carsAvailable, carsSold, testDrivesToday, followupsToday, monthlySales,
      conversionRate: totalLeads > 0 ? `${Math.round(((pipelineCounts.Won + pipelineCounts.Booked) / totalLeads) * 100)}%` : '—',
      pipelineCounts
    };
  }

  // --- ACTIONS TODAY ---
  static async getActionsToday() {
    if (isAtlasOnline()) {
      const followups = await FollowUp.find({ status: { $in: ['pending', 'Pending'] } })
        .populate('customer_id')
        .populate('lead_id')
        .sort({ scheduled_at: 1 })
        .limit(6);

      return followups.map((f, idx) => ({
        id: f._id,
        time: f.scheduled_at ? new Date(f.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '10:30 AM',
        name: f.customer_id?.name || 'Customer',
        phone: f.customer_id?.phone || '',
        action: f.type,
        car: f.lead_id?.interested_car || 'Vehicle',
        priority: f.lead_id?.priority || 'warm',
        lead_id: f.lead_id?._id
      }));
    }

    const pending = diskStore.followups.filter(f => ['pending', 'Pending'].includes(f.status)).slice(0, 6);
    return pending.map((f, idx) => {
      const lead = diskStore.leads.find(l => l._id === f.lead_id);
      const cust = diskStore.customers.find(c => c._id === (f.customer_id || lead?.customer_id));
      return {
        id: f._id,
        time: f.scheduled_at ? new Date(f.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '10:30 AM',
        name: cust?.name || 'Customer',
        phone: cust?.phone || '',
        action: f.type,
        car: lead?.interested_car || 'Vehicle',
        priority: lead?.priority || 'warm',
        lead_id: lead?._id
      };
    });
  }

  // --- VEHICLES ---
  static async getVehicles({ status, search }) {
    if (isAtlasOnline()) {
      const query = {};
      if (status && status !== 'All') {
        const snakeStatus = toSnake(status);
        query.status = { $in: [snakeStatus, status] };
      }
      if (search) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ brand: regex }, { model: regex }, { stock_id: regex }, { registration_number: regex }];
      }
      return await Vehicle.find(query).sort({ createdAt: -1 });
    }

    let list = [...diskStore.vehicles];
    if (status && status !== 'All') {
      const snakeStatus = toSnake(status);
      list = list.filter(v => v.status?.toLowerCase() === snakeStatus || v.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(v => 
        v.brand?.toLowerCase().includes(s) || 
        v.model?.toLowerCase().includes(s) || 
        v.stock_id?.toLowerCase().includes(s) ||
        v.registration_number?.toLowerCase().includes(s)
      );
    }
    return list;
  }

  static async getVehicleById(id) {
    if (isAtlasOnline()) {
      return await Vehicle.findById(id);
    }
    return diskStore.vehicles.find(v => v._id === id);
  }

  static async createVehicle(body) {
    const askingPrice = Number(body.asking_price || body.selling_price || 0);
    const vehicleData = {
      stock_id: (body.stock_id || generateStockId()).toUpperCase().trim(),
      registration_number: body.registration_number ? body.registration_number.toUpperCase().trim() : undefined,
      brand: body.brand || 'Hyundai',
      model: body.model || 'Car',
      variant: body.variant || '',
      year: Number(body.year || 2022),
      fuel: toSnake(body.fuel || 'petrol'),
      transmission: toSnake(body.transmission || 'manual'),
      body_type: toSnake(body.body_type || 'suv'),
      km_driven: Number(body.km_driven || 0),
      owners: Number(body.owners || 1),
      colour: body.colour || '',
      registration_city: body.registration_city || '',
      insurance_valid_until: body.insurance_valid_until ? new Date(body.insurance_valid_until) : undefined,
      purchase_price: Number(body.purchase_price || 0),
      asking_price: askingPrice,
      selling_price: askingPrice,
      minimum_selling_price: Number(body.minimum_selling_price || 0),
      purchase_date: body.purchase_date ? new Date(body.purchase_date) : undefined,
      location: body.location || 'Main Showroom',
      status: toSnake(body.status || 'available'),
      images: Array.isArray(body.images) ? body.images : [],
      notes: body.notes || ''
    };

    if (isAtlasOnline()) {
      const veh = new Vehicle(vehicleData);
      return await veh.save();
    }

    const newVeh = {
      _id: generateId('veh'),
      ...vehicleData,
      year: vehicleData.manufacturing_year,
      fuel: vehicleData.fuel_type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    diskStore.vehicles.unshift(newVeh);
    saveStoreToDisk();
    return newVeh;
  }

  static async updateVehicle(id, updates) {
    if (updates.status) updates.status = toSnake(updates.status);
    if (updates.selling_price) updates.asking_price = Number(updates.selling_price);
    if (updates.year) updates.manufacturing_year = Number(updates.year);

    if (isAtlasOnline()) {
      return await Vehicle.findByIdAndUpdate(id, updates, { new: true });
    }

    const idx = diskStore.vehicles.findIndex(v => v._id === id);
    if (idx === -1) return null;
    diskStore.vehicles[idx] = { 
      ...diskStore.vehicles[idx], 
      ...updates, 
      selling_price: updates.asking_price || diskStore.vehicles[idx].selling_price,
      updatedAt: new Date().toISOString() 
    };
    saveStoreToDisk();
    return diskStore.vehicles[idx];
  }

  static async deleteVehicle(id) {
    if (isAtlasOnline()) {
      return await Vehicle.findByIdAndDelete(id);
    }
    const initial = diskStore.vehicles.length;
    diskStore.vehicles = diskStore.vehicles.filter(v => v._id !== id);
    saveStoreToDisk();
    return diskStore.vehicles.length < initial;
  }

  // --- CUSTOMERS ---
  static async getCustomers(search) {
    if (isAtlasOnline()) {
      const query = {};
      if (search) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: regex }, { phone: regex }, { city: regex }];
      }
      const customers = await Customer.find(query).sort({ createdAt: -1 });
      return await Promise.all(customers.map(async (c) => {
        const [leadsCount, dealsCount] = await Promise.all([
          Lead.countDocuments({ customer_id: c._id }),
          Deal.countDocuments({ customer_id: c._id })
        ]);
        return { ...c.toObject(), leadsCount, dealsCount };
      }));
    }

    let list = diskStore.customers.map(c => {
      const leadsCount = diskStore.leads.filter(l => l.customer_id === c._id).length;
      const dealsCount = diskStore.deals.filter(d => d.customer_id === c._id).length;
      return { ...c, leadsCount, dealsCount };
    });

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c => c.name?.toLowerCase().includes(s) || c.phone?.includes(s) || c.city?.toLowerCase().includes(s));
    }
    return list;
  }

  static async createOrUpdateCustomer({ name, phone, email, city, address, area, notes, tags }) {
    const normalized = normalizePhone(phone);
    if (isAtlasOnline()) {
      let cust = await Customer.findOne({ phone: normalized });
      if (cust) {
        cust.name = name || cust.name;
        cust.email = email || cust.email;
        cust.city = city || cust.city;
        cust.address = address || cust.address;
        return await cust.save();
      }
      return await Customer.create({
        name: (name || 'Customer').trim(),
        phone: normalized,
        email: email ? email.toLowerCase().trim() : undefined,
        city: city || '',
        area: area || '',
        address: address || '',
        notes: notes || '',
        tags: Array.isArray(tags) ? tags : [],
        status: 'active'
      });
    }

    let existing = diskStore.customers.find(c => c.phone === normalized);
    if (existing) {
      existing.name = name || existing.name;
      existing.email = email || existing.email;
      existing.city = city || existing.city;
      existing.address = address || existing.address;
      existing.updatedAt = new Date().toISOString();
      saveStoreToDisk();
      return existing;
    }

    const newCust = {
      _id: generateId('cust'),
      name: (name || 'Customer').trim(),
      phone: normalized,
      email: email ? email.toLowerCase().trim() : '',
      city: city || '',
      area: area || '',
      address: address || '',
      notes: notes || '',
      tags: Array.isArray(tags) ? tags : [],
      status: 'active',
      createdAt: new Date().toISOString()
    };
    diskStore.customers.unshift(newCust);
    saveStoreToDisk();
    return newCust;
  }

  // --- LEADS ---
  static async getLeads({ status, search }) {
    if (isAtlasOnline()) {
      const query = {};
      if (status && status !== 'All') {
        const snakeStatus = toSnake(status);
        query.status = { $in: [snakeStatus, status] };
      }
      let leads = await Lead.find(query)
        .populate('customer_id')
        .populate('assigned_to', 'name email role')
        .sort({ createdAt: -1 });

      if (search) {
        const s = search.toLowerCase();
        leads = leads.filter(l => 
          l.customer_id?.name?.toLowerCase().includes(s) ||
          l.customer_id?.phone?.includes(s) ||
          l.interested_car?.toLowerCase().includes(s) ||
          l.lead_number?.toLowerCase().includes(s)
        );
      }
      return leads;
    }

    let list = diskStore.leads.map(l => {
      const cust = diskStore.customers.find(c => c._id === l.customer_id);
      const user = diskStore.users.find(u => u._id === l.assigned_to) || { name: 'Amit Sharma', email: 'admin@motorwise.com' };
      return {
        ...l,
        customer_id: cust || { name: 'Customer', phone: '' },
        assigned_to: user,
        assigned_to_name: user.name
      };
    });

    if (status && status !== 'All') {
      const snakeStatus = toSnake(status);
      list = list.filter(l => l.status?.toLowerCase() === snakeStatus || l.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(l => 
        l.customer_id?.name?.toLowerCase().includes(s) ||
        l.customer_id?.phone?.includes(s) ||
        l.interested_car?.toLowerCase().includes(s) ||
        l.lead_number?.toLowerCase().includes(s)
      );
    }
    return list;
  }

  static async getLeadById(id) {
    if (isAtlasOnline()) {
      const lead = await Lead.findById(id)
        .populate('customer_id')
        .populate('assigned_to', 'name email role');
      if (!lead) return null;

      const [activities, followups, testDrives, deals] = await Promise.all([
        Activity.find({ $or: [{ lead_id: lead._id }, { customer_id: lead.customer_id?._id }] }).sort({ createdAt: -1 }),
        FollowUp.find({ lead_id: lead._id }).sort({ scheduled_at: 1 }),
        TestDrive.find({ lead_id: lead._id }).populate('vehicle_id'),
        Deal.find({ lead_id: lead._id }).populate('vehicle_id')
      ]);
      return { lead, activities, followups, testDrives, deals };
    }

    const leadRaw = diskStore.leads.find(l => l._id === id);
    if (!leadRaw) return null;

    const cust = diskStore.customers.find(c => c._id === leadRaw.customer_id) || { name: 'Customer', phone: '' };
    const user = diskStore.users.find(u => u._id === leadRaw.assigned_to) || { name: 'Amit Sharma' };
    const lead = { ...leadRaw, customer_id: cust, assigned_to: user, assigned_to_name: user.name };

    const activities = diskStore.activities.filter(a => a.lead_id === id || a.customer_id === cust._id);
    const followups = diskStore.followups.filter(f => f.lead_id === id);
    const testDrives = diskStore.testDrives.filter(t => t.lead_id === id).map(t => ({
      ...t, vehicle_id: diskStore.vehicles.find(v => v._id === t.vehicle_id)
    }));
    const deals = diskStore.deals.filter(d => d.lead_id === id).map(d => ({
      ...d, vehicle_id: diskStore.vehicles.find(v => v._id === d.vehicle_id)
    }));

    return { lead, activities, followups, testDrives, deals };
  }

  static async createLead(data) {
    const { name, phone, email, source, priority, interested_car, budget_max, buying_timeline, notes } = data;
    const customer = await this.createOrUpdateCustomer({ name, phone, email, source });
    const leadNumber = generateLeadNumber();
    const leadPriority = ['hot', 'warm', 'cold'].includes(toSnake(priority)) ? toSnake(priority) : 'warm';
    const leadSource = toSnake(source || 'walk_in');

    if (isAtlasOnline()) {
      const defaultUser = await User.findOne({ role: 'admin' });
      const newLead = await Lead.create({
        lead_number: leadNumber,
        customer_id: customer._id,
        assigned_to: defaultUser?._id || new mongoose.Types.ObjectId(),
        source: leadSource,
        priority: leadPriority,
        interested_car: interested_car || 'Vehicle',
        requirements: {
          budget_max: budget_max ? Number(budget_max) : 800000,
          buying_timeline: toSnake(buying_timeline || 'within_30_days')
        },
        status: 'new',
        notes: notes || ''
      });

      await this.logActivity({
        lead_id: newLead._id,
        customer_id: customer._id,
        activity_type: 'lead_created',
        title: `Lead ${leadNumber} Created`,
        description: `Lead created for ${customer.name}. Interested in ${newLead.interested_car}.`
      });

      await FollowUp.create({
        lead_id: newLead._id,
        customer_id: customer._id,
        assigned_to: newLead.assigned_to,
        scheduled_at: new Date(Date.now() + 86400000),
        type: 'call',
        notes: `Initial qualification call for ${customer.name}`,
        status: 'pending'
      });

      return await Lead.findById(newLead._id).populate('customer_id').populate('assigned_to');
    }

    // Disk store
    const newLead = {
      _id: generateId('lead'),
      lead_number: leadNumber,
      customer_id: customer._id,
      assigned_to: 'usr_admin',
      assigned_to_name: 'Amit Sharma',
      source: leadSource,
      priority: leadPriority,
      interested_car: interested_car || 'Vehicle',
      budget_max: budget_max ? Number(budget_max) : 800000,
      requirements: {
        budget_max: budget_max ? Number(budget_max) : 800000,
        buying_timeline: toSnake(buying_timeline || 'within_30_days')
      },
      status: 'new',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    diskStore.leads.unshift(newLead);

    this.logActivity({
      lead_id: newLead._id,
      customer_id: customer._id,
      activity_type: 'lead_created',
      title: `Lead ${leadNumber} Created`,
      description: `Lead created for ${customer.name}. Interested in ${newLead.interested_car}.`
    });

    diskStore.followups.unshift({
      _id: generateId('fu'),
      lead_id: newLead._id,
      customer_id: customer._id,
      assigned_to: 'usr_admin',
      assigned_to_name: 'Amit Sharma',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      type: 'call',
      notes: `Initial qualification call for ${customer.name}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    saveStoreToDisk();
    return { ...newLead, customer_id: customer };
  }

  static async updateLead(id, updates) {
    if (updates.status) updates.status = toSnake(updates.status);

    if (isAtlasOnline()) {
      const existing = await Lead.findById(id);
      if (!existing) return null;
      if (updates.status === 'lost') updates.closed_at = new Date();
      if (updates.status === 'won') updates.closed_at = new Date();
      const updated = await Lead.findByIdAndUpdate(id, updates, { new: true })
        .populate('customer_id')
        .populate('assigned_to');

      if (updates.status && updates.status !== existing.status) {
        await this.logActivity({
          lead_id: updated._id,
          customer_id: updated.customer_id?._id,
          activity_type: 'stage_changed',
          title: `Stage Changed to ${updates.status.toUpperCase()}`,
          description: `Lead transitioned from "${existing.status}" to "${updates.status}"`
        });
      }
      return updated;
    }

    const idx = diskStore.leads.findIndex(l => l._id === id);
    if (idx === -1) return null;
    const oldStatus = diskStore.leads[idx].status;
    diskStore.leads[idx] = { ...diskStore.leads[idx], ...updates, updatedAt: new Date().toISOString() };

    if (updates.status && updates.status !== oldStatus) {
      this.logActivity({
        lead_id: id,
        customer_id: diskStore.leads[idx].customer_id,
        activity_type: 'stage_changed',
        title: `Stage Changed to ${updates.status.toUpperCase()}`,
        description: `Lead transitioned from "${oldStatus}" to "${updates.status}"`
      });
    }

    saveStoreToDisk();
    const cust = diskStore.customers.find(c => c._id === diskStore.leads[idx].customer_id);
    return { ...diskStore.leads[idx], customer_id: cust };
  }

  static async deleteLead(id) {
    if (isAtlasOnline()) {
      return await Lead.findByIdAndDelete(id);
    }
    const initial = diskStore.leads.length;
    diskStore.leads = diskStore.leads.filter(l => l._id !== id);
    saveStoreToDisk();
    return diskStore.leads.length < initial;
  }

  // --- FOLLOW-UPS ---
  static async getFollowups(filter) {
    if (isAtlasOnline()) {
      const query = {};
      if (filter === 'pending') query.status = { $in: ['pending', 'Pending'] };
      return await FollowUp.find(query)
        .populate({ path: 'lead_id', populate: { path: 'customer_id' } })
        .populate('customer_id')
        .populate('assigned_to', 'name email')
        .sort({ scheduled_at: 1 });
    }

    let list = diskStore.followups.map(f => {
      const lead = diskStore.leads.find(l => l._id === f.lead_id);
      const cust = diskStore.customers.find(c => c._id === (f.customer_id || lead?.customer_id));
      const leadPop = lead ? { ...lead, customer_id: cust } : null;
      return { ...f, lead_id: leadPop, customer_id: cust, assigned_to_name: f.assigned_to_name || 'Amit Sharma' };
    });

    if (filter === 'pending') {
      list = list.filter(f => ['pending', 'Pending'].includes(f.status));
    }
    return list;
  }

  static async createFollowup(body) {
    const scheduledAt = body.scheduled_at ? new Date(body.scheduled_at) : new Date();
    const fuType = toSnake(body.type || 'call');

    let customerId = body.customer_id;
    if (!customerId && body.customer_phone) {
      const cust = await this.createOrUpdateCustomer({ name: body.customer_name, phone: body.customer_phone });
      customerId = cust._id;
    }

    if (isAtlasOnline()) {
      const newFu = await FollowUp.create({
        lead_id: body.lead_id,
        customer_id: customerId,
        assigned_to: body.assigned_to || (await User.findOne({ role: 'admin' }))?._id,
        scheduled_at: scheduledAt,
        type: fuType,
        notes: body.notes || 'Routine follow-up',
        status: 'pending'
      });
      return await FollowUp.findById(newFu._id).populate('customer_id').populate('lead_id');
    }

    const newFu = {
      _id: generateId('fu'),
      lead_id: body.lead_id,
      customer_id: customerId,
      assigned_to: 'usr_admin',
      assigned_to_name: 'Amit Sharma',
      scheduled_at: scheduledAt.toISOString(),
      type: fuType,
      notes: body.notes || 'Routine follow-up',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    diskStore.followups.unshift(newFu);
    saveStoreToDisk();
    const cust = diskStore.customers.find(c => c._id === customerId);
    return { ...newFu, customer_id: cust };
  }

  static async updateFollowup(id, updates) {
    if (updates.status) updates.status = toSnake(updates.status);
    if (updates.status === 'completed') updates.completed_at = new Date();

    if (isAtlasOnline()) {
      return await FollowUp.findByIdAndUpdate(id, updates, { new: true });
    }

    const idx = diskStore.followups.findIndex(f => f._id === id);
    if (idx === -1) return null;
    diskStore.followups[idx] = { ...diskStore.followups[idx], ...updates, updatedAt: new Date().toISOString() };
    saveStoreToDisk();
    return diskStore.followups[idx];
  }

  // --- TEST DRIVES ---
  static async getTestDrives() {
    if (isAtlasOnline()) {
      return await TestDrive.find()
        .populate('customer_id')
        .populate('vehicle_id')
        .populate('employee_id', 'name email')
        .sort({ scheduled_at: -1 });
    }

    return diskStore.testDrives.map(td => ({
      ...td,
      customer_id: diskStore.customers.find(c => c._id === td.customer_id) || { name: 'Customer' },
      vehicle_id: diskStore.vehicles.find(v => v._id === td.vehicle_id) || { brand: 'Vehicle', model: '' },
      employee_id: { name: 'Amit Sharma' }
    }));
  }

  static async createTestDrive(body) {
    let customerId = body.customer_id;
    if (!customerId && body.customer_phone) {
      const cust = await this.createOrUpdateCustomer({ name: body.customer_name, phone: body.customer_phone });
      customerId = cust._id;
    }

    let vehicleId = body.vehicle_id;
    if (!vehicleId && diskStore.vehicles.length > 0) {
      vehicleId = diskStore.vehicles[0]._id;
    }

    let finalDate = body.scheduled_at ? new Date(body.scheduled_at) : (body.date ? new Date(body.date) : new Date());

    if (isAtlasOnline()) {
      const td = await TestDrive.create({
        lead_id: body.lead_id,
        customer_id: customerId,
        vehicle_id: vehicleId,
        employee_id: (await User.findOne({ role: 'admin' }))?._id,
        scheduled_at: finalDate,
        location: body.location || 'Showroom',
        status: 'scheduled'
      });
      if (body.lead_id) await Lead.findByIdAndUpdate(body.lead_id, { status: 'test_drive' });
      return await TestDrive.findById(td._id).populate('customer_id').populate('vehicle_id');
    }

    const newTd = {
      _id: generateId('td'),
      lead_id: body.lead_id,
      customer_id: customerId,
      vehicle_id: vehicleId,
      employee_id: 'usr_admin',
      employee_name: 'Amit Sharma',
      scheduled_at: finalDate.toISOString(),
      location: body.location || 'Showroom',
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    diskStore.testDrives.unshift(newTd);

    if (body.lead_id) {
      const lead = diskStore.leads.find(l => l._id === body.lead_id);
      if (lead) lead.status = 'test_drive';
    }

    saveStoreToDisk();
    return newTd;
  }

  static async updateTestDrive(id, updates) {
    if (updates.status) updates.status = toSnake(updates.status);

    if (isAtlasOnline()) {
      return await TestDrive.findByIdAndUpdate(id, updates, { new: true });
    }

    const idx = diskStore.testDrives.findIndex(t => t._id === id);
    if (idx === -1) return null;
    diskStore.testDrives[idx] = { ...diskStore.testDrives[idx], ...updates };
    saveStoreToDisk();
    return diskStore.testDrives[idx];
  }

  // --- DEALS ---
  static async getDeals() {
    if (isAtlasOnline()) {
      return await Deal.find()
        .populate('customer_id')
        .populate('vehicle_id')
        .populate('salesperson_id', 'name email')
        .sort({ createdAt: -1 });
    }

    return diskStore.deals.map(d => ({
      ...d,
      customer_id: diskStore.customers.find(c => c._id === d.customer_id) || { name: 'Customer' },
      vehicle_id: diskStore.vehicles.find(v => v._id === d.vehicle_id) || { brand: 'Car', model: 'Model' },
      salesperson_id: { name: 'Amit Sharma' }
    }));
  }

  static async createDeal(body) {
    let customerId = body.customer_id;
    if (!customerId && body.customer_phone) {
      const cust = await this.createOrUpdateCustomer({ name: body.customer_name, phone: body.customer_phone });
      customerId = cust._id;
    }

    const vehicleId = body.vehicle_id;
    const finalPrice = Number(body.final_selling_price || body.selling_price || 600000);
    const token = Number(body.booking_amount || 25000);
    const dealNum = generateDealNumber();

    if (isAtlasOnline()) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (vehicle && ['sold', 'booked'].includes(vehicle.status)) {
        throw new Error(`Vehicle ${vehicle.brand} ${vehicle.model} is already ${vehicle.status}`);
      }

      const newDeal = await Deal.create({
        deal_number: dealNum,
        lead_id: body.lead_id,
        customer_id: customerId,
        vehicle_id: vehicleId,
        salesperson_id: (await User.findOne({ role: 'admin' }))?._id,
        asking_price: vehicle?.asking_price || finalPrice,
        final_selling_price: finalPrice,
        booking_amount: token,
        amount_received: token,
        status: toSnake(body.deal_status || body.status || 'booked'),
        payment_status: token >= finalPrice ? 'paid' : (token > 0 ? 'partial' : 'pending'),
        booking_date: new Date()
      });

      if (vehicle) {
        vehicle.status = 'booked';
        await vehicle.save();
      }

      if (body.lead_id) {
        await Lead.findByIdAndUpdate(body.lead_id, { status: 'booked' });
        await this.logActivity({
          lead_id: body.lead_id,
          customer_id: customerId,
          activity_type: 'deal_created',
          title: `Deal Created (${dealNum})`,
          description: `Deal recorded. Final Price: ₹${(finalPrice/100000).toFixed(2)}L, Token: ₹${token.toLocaleString()}`
        });
      }

      return await Deal.findById(newDeal._id).populate('customer_id').populate('vehicle_id');
    }

    // Check availability in diskStore
    const veh = diskStore.vehicles.find(v => v._id === vehicleId);
    if (veh && ['sold', 'booked'].includes(veh.status)) {
      throw new Error(`Vehicle is already ${veh.status}`);
    }

    const newDeal = {
      _id: generateId('deal'),
      deal_number: dealNum,
      lead_id: body.lead_id,
      customer_id: customerId,
      vehicle_id: vehicleId,
      final_selling_price: finalPrice,
      selling_price: finalPrice,
      booking_amount: token,
      amount_received: token,
      status: toSnake(body.deal_status || body.status || 'booked'),
      deal_status: toSnake(body.deal_status || body.status || 'booked'),
      payment_status: token >= finalPrice ? 'paid' : (token > 0 ? 'partial' : 'pending'),
      booking_date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    diskStore.deals.unshift(newDeal);

    if (veh) veh.status = 'booked';
    if (body.lead_id) {
      const lead = diskStore.leads.find(l => l._id === body.lead_id);
      if (lead) lead.status = 'booked';
    }

    this.logActivity({
      lead_id: body.lead_id,
      customer_id: customerId,
      activity_type: 'deal_created',
      title: `Deal Created (${dealNum})`,
      description: `Deal recorded. Final Price: ₹${(finalPrice/100000).toFixed(2)}L, Token: ₹${token.toLocaleString()}`
    });

    saveStoreToDisk();
    const cust = diskStore.customers.find(c => c._id === customerId);
    return { ...newDeal, customer_id: cust, vehicle_id: veh };
  }

  static async updateDeal(id, updates) {
    const targetStatus = toSnake(updates.status || updates.deal_status);
    if (targetStatus) updates.status = targetStatus;

    if (isAtlasOnline()) {
      const existing = await Deal.findById(id);
      if (!existing) return null;

      if (targetStatus === 'delivered') {
        updates.payment_status = 'paid';
        updates.delivered_at = new Date();
        await Vehicle.findByIdAndUpdate(existing.vehicle_id, { status: 'sold', sold_at: new Date() });
        if (existing.lead_id) await Lead.findByIdAndUpdate(existing.lead_id, { status: 'won', closed_at: new Date() });
      } else if (targetStatus === 'cancelled') {
        await Vehicle.findByIdAndUpdate(existing.vehicle_id, { status: 'available' });
        if (existing.lead_id) await Lead.findByIdAndUpdate(existing.lead_id, { status: 'negotiation' });
      }

      return await Deal.findByIdAndUpdate(id, updates, { new: true })
        .populate('customer_id')
        .populate('vehicle_id');
    }

    const idx = diskStore.deals.findIndex(d => d._id === id);
    if (idx === -1) return null;
    const deal = diskStore.deals[idx];

    if (targetStatus === 'delivered') {
      updates.payment_status = 'paid';
      updates.delivered_at = new Date().toISOString();
      const veh = diskStore.vehicles.find(v => v._id === deal.vehicle_id);
      if (veh) { veh.status = 'sold'; veh.sold_at = new Date().toISOString(); }
      const lead = diskStore.leads.find(l => l._id === deal.lead_id);
      if (lead) { lead.status = 'won'; lead.closed_at = new Date().toISOString(); }
    } else if (targetStatus === 'cancelled') {
      const veh = diskStore.vehicles.find(v => v._id === deal.vehicle_id);
      if (veh) veh.status = 'available';
      const lead = diskStore.leads.find(l => l._id === deal.lead_id);
      if (lead) lead.status = 'negotiation';
    }

    diskStore.deals[idx] = { ...deal, ...updates, updatedAt: new Date().toISOString() };
    saveStoreToDisk();
    return diskStore.deals[idx];
  }

  // --- ACTIVITIES ---
  static async getActivities() {
    if (isAtlasOnline()) {
      return await Activity.find()
        .populate('lead_id', 'lead_number interested_car')
        .populate('customer_id', 'name phone')
        .sort({ createdAt: -1 })
        .limit(60);
    }
    return diskStore.activities.slice(0, 60);
  }

  static async logActivity(params) {
    if (isAtlasOnline()) {
      try {
        const act = new Activity(params);
        return await act.save();
      } catch (e) {
        // Fallback
      }
    }

    const newAct = {
      _id: generateId('act'),
      ...params,
      createdAt: new Date().toISOString()
    };
    diskStore.activities.unshift(newAct);
    saveStoreToDisk();
    return newAct;
  }

  // --- SEARCH ---
  static async search(q) {
    const term = (q || '').trim().toLowerCase();
    if (!term) return { customers: [], vehicles: [], leads: [] };

    if (isAtlasOnline()) {
      const regex = new RegExp(term, 'i');
      const [customers, vehicles, leads] = await Promise.all([
        Customer.find({ $or: [{ name: regex }, { phone: regex }] }).limit(5),
        Vehicle.find({ $or: [{ brand: regex }, { model: regex }, { stock_id: regex }] }).limit(5),
        Lead.find({ $or: [{ lead_number: regex }, { interested_car: regex }] }).populate('customer_id').limit(5)
      ]);
      return { customers, vehicles, leads };
    }

    const customers = diskStore.customers.filter(c => c.name?.toLowerCase().includes(term) || c.phone?.includes(term)).slice(0, 5);
    const vehicles = diskStore.vehicles.filter(v => v.brand?.toLowerCase().includes(term) || v.model?.toLowerCase().includes(term) || v.stock_id?.toLowerCase().includes(term)).slice(0, 5);
    const leads = diskStore.leads.map(l => ({ ...l, customer_id: diskStore.customers.find(c => c._id === l.customer_id) }))
      .filter(l => l.customer_id?.name?.toLowerCase().includes(term) || l.interested_car?.toLowerCase().includes(term) || l.lead_number?.toLowerCase().includes(term))
      .slice(0, 5);

    return { customers, vehicles, leads };
  }

  // --- CLEAR DATA ---
  static async clearAll() {
    if (isAtlasOnline()) {
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
    diskStore.customers = [];
    diskStore.vehicles = [];
    diskStore.leads = [];
    diskStore.followups = [];
    diskStore.testDrives = [];
    diskStore.deals = [];
    diskStore.activities = [];
    saveStoreToDisk();
  }
}

module.exports = DBManager;
