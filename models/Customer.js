const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  phone: { 
    type: String, 
    required: true, 
    trim: true,
    index: true 
  },
  email: { 
    type: String, 
    trim: true, 
    lowercase: true,
    default: '' 
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
    default: 'active' 
  },
  custom_fields: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Customer', customerSchema);
