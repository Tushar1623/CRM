const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    index: true 
  },
  alternate_phone: { 
    type: String, 
    trim: true 
  },
  email: { 
    type: String, 
    trim: true, 
    lowercase: true, 
    index: true 
  },
  city: { 
    type: String, 
    trim: true, 
    index: true 
  },
  area: { 
    type: String, 
    trim: true 
  },
  address: { 
    type: String, 
    trim: true 
  },
  source: { 
    type: String, 
    default: 'Walk-in' 
  },
  tags: [{ 
    type: String, 
    trim: true 
  }],
  status: { 
    type: String, 
    enum: ['Active', 'Lead', 'Customer', 'Blacklisted'], 
    default: 'Active',
    index: true 
  },
  notes: { 
    type: String 
  }
}, { 
  timestamps: true 
});

// Full-text search index across core customer identifiers
customerSchema.index({ name: 'text', phone: 'text', email: 'text', city: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
