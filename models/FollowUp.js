const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  lead_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead' 
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
  assigned_to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  assigned_to_name: { 
    type: String, 
    default: 'Amit Sharma' 
  },
  scheduled_at: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  type: { 
    type: String, 
    default: 'Call' 
  },
  status: { 
    type: String, 
    default: 'Pending',
    index: true 
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

module.exports = mongoose.model('FollowUp', followUpSchema);
