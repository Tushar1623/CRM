const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  lead_number: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    index: true 
  },
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true,
    index: true 
  },
  assigned_to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  interested_car: { 
    type: String, 
    required: true, 
    trim: true 
  },
  budget_max: { 
    type: Number, 
    default: 0 
  },
  source: { 
    type: String, 
    default: 'walk_in' 
  },
  priority: { 
    type: String, 
    enum: ['hot', 'warm', 'cold'], 
    default: 'warm' 
  },
  status: { 
    type: String, 
    enum: [
      'new', 'contacted', 'interested', 'follow_up', 
      'test_drive', 'negotiation', 'booked', 'won', 'lost'
    ], 
    default: 'new',
    index: true 
  },
  lost_reason: { 
    type: String 
  },
  notes: { 
    type: String,
    default: '' 
  },
  closed_at: { 
    type: Date 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

leadSchema.virtual('assigned_to_name').get(function() {
  return this.assigned_to?.name || 'Sales Executive';
});

module.exports = mongoose.model('Lead', leadSchema);
