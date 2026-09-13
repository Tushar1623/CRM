const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  lead_number: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true,
    index: true 
  },
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer' 
  },
  customer_name: { 
    type: String, 
    default: '' 
  },
  customer_phone: { 
    type: String, 
    default: '' 
  },
  customer_email: { 
    type: String, 
    default: '' 
  },
  assigned_to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  assigned_to_name: { 
    type: String, 
    default: 'Amit Sharma' 
  },
  interested_car: { 
    type: String, 
    default: 'Open Requirement', 
    trim: true 
  },
  budget_max: { 
    type: Number, 
    default: 0 
  },
  source: { 
    type: String, 
    default: 'Walk-in' 
  },
  priority: { 
    type: String, 
    default: 'Warm' 
  },
  status: { 
    type: String, 
    default: 'New Lead',
    index: true 
  },
  buying_timeline: { 
    type: String, 
    default: 'Within 30 Days' 
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Lead', leadSchema);
