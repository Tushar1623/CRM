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
    ref: 'User' 
  },
  user_name: { 
    type: String, 
    default: 'System' 
  },
  activity_type: { 
    type: String, 
    enum: [
      'lead_created', 'lead_assigned', 'stage_changed', 'call_logged', 
      'whatsapp_sent', 'followup_scheduled', 'followup_completed', 
      'test_drive_scheduled', 'test_drive_completed', 'deal_created', 
      'deal_status_changed', 'vehicle_reserved', 'vehicle_sold', 'note_added', 'other'
    ],
    required: true,
    index: true
  },
  description: { 
    type: String, 
    required: true 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  }
}, { 
  timestamps: true 
});

activitySchema.index({ lead_id: 1, createdAt: -1 });
activitySchema.index({ customer_id: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
