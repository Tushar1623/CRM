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
  email: { 
    type: String, 
    trim: true, 
    lowercase: true 
  },
  city: { 
    type: String, 
    trim: true,
    default: '' 
  },
  address: { 
    type: String, 
    trim: true,
    default: '' 
  },
  status: { 
    type: String, 
    enum: ['active', 'blacklisted'], 
    default: 'active' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

customerSchema.pre('save', function(next) {
  if (this.phone) {
    this.phone = normalizePhone(this.phone);
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
