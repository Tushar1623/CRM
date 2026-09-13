const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  lead_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead',
    index: true 
  },
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer' 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  activity_type: { 
    type: String, 
    required: true,
    index: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

activitySchema.virtual('user_name').get(function() {
  return this.user_id?.name || 'System';
});

module.exports = mongoose.model('Activity', activitySchema);
