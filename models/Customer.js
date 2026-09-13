const mongoose = require('mongoose');
const { normalizePhone } = require('../utils/normalizePhone');

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
  status: { 
    type: String, 
    enum: ['active', 'blacklisted'], 
    default: 'active',
    index: true 
  },
  tags: [{ 
    type: String, 
    trim: true 
  }],
  notes: { 
    type: String 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to normalize phone number
customerSchema.pre('save', function(next) {
  if (this.phone) {
    this.phone = normalizePhone(this.phone);
  }
  if (this.alternate_phone) {
    this.alternate_phone = normalizePhone(this.alternate_phone);
  }
  next();
});

// Full-text search index across core customer identifiers
customerSchema.index({ name: 'text', phone: 'text', email: 'text', city: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
