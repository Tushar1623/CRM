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
    required: true,
    index: true 
  },
  assigned_to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  scheduled_at: { 
    type: Date, 
    required: true, 
    index: true 
  },
  type: { 
    type: String, 
    enum: ['call', 'whatsapp', 'showroom_visit', 'meeting', 'test_drive', 'negotiation', 'other'], 
    required: true,
    default: 'call'
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'missed', 'rescheduled'], 
    default: 'pending',
    index: true 
  },
  outcome: { 
    type: String,
    enum: ['interested', 'no_answer', 'call_later', 'test_drive', 'negotiation', 'not_interested', 'other']
  },
  notes: { 
    type: String,
    trim: true 
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

followUpSchema.index({ scheduled_at: 1, status: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
