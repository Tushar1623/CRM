const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  lead_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead', 
    index: true 
  },
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    index: true 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true 
  },
  activity_type: { 
    type: String, 
    enum: [
      'lead_created', 'lead_assigned', 'stage_changed', 
      'call_logged', 'whatsapp_opened', 
      'followup_created', 'followup_completed', 
      'vehicle_interest_added', 
      'test_drive_created', 'test_drive_completed', 
      'deal_created', 'deal_status_changed', 
      'vehicle_reserved', 'vehicle_sold', 
      'note_added'
    ],
    required: true,
    index: true
  },
  title: { 
    type: String,
    trim: true 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed,
    default: {} 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// UI compatibility virtuals
activitySchema.virtual('user_name').get(function() {
  return this.user_id?.name || 'System';
});

activitySchema.virtual('subject').get(function() {
  return this.title || this.activity_type.replace(/_/g, ' ').toUpperCase();
});

activitySchema.virtual('type').get(function() {
  return this.activity_type.toUpperCase();
});

activitySchema.index({ lead_id: 1, createdAt: -1 });
activitySchema.index({ customer_id: 1, createdAt: -1 });
activitySchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
