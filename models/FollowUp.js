const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  lead_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead', 
    required: true,
    index: true 
  },
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer' 
  },
  assigned_to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  scheduled_at: { 
    type: Date, 
    required: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: ['call', 'whatsapp', 'showroom_visit', 'meeting', 'other'], 
    default: 'call' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'missed'], 
    default: 'pending' 
  },
  notes: { 
    type: String,
    default: '' 
  },
  completed_at: { 
    type: Date 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

followUpSchema.virtual('assigned_to_name').get(function() {
  return this.assigned_to?.name || 'Sales Executive';
});

module.exports = mongoose.model('FollowUp', followUpSchema);
