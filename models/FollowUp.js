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
    ref: 'Customer', 
    index: true 
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
    required: true, 
    index: true 
  },
  type: { 
    type: String, 
    enum: ['Call', 'WhatsApp', 'Meeting', 'Showroom Visit', 'Test Drive', 'Follow-up', 'Negotiation', 'Other'], 
    required: true,
    default: 'Call'
  },
  notes: { 
    type: String 
  },
  outcome: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Missed', 'Rescheduled'], 
    default: 'Pending',
    index: true 
  },
  completed_at: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

followUpSchema.index({ scheduled_at: 1, status: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
