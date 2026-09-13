const mongoose = require('mongoose');

const testDriveSchema = new mongoose.Schema({
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
  vehicle_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true, 
    index: true 
  },
  employee_id: { 
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
  location: { 
    type: String, 
    trim: true,
    default: 'Showroom' 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'],
    default: 'scheduled',
    index: true 
  },
  result: {
    type: String,
    enum: ['interested', 'follow_up', 'negotiation', 'not_interested']
  },
  driving_license_no: { 
    type: String, 
    trim: true 
  },
  customer_feedback: { 
    type: String,
    trim: true 
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

// Virtuals for UI helpers
testDriveSchema.virtual('employee_name').get(function() {
  return this.employee_id?.name || 'Sales Executive';
});

testDriveSchema.virtual('date').get(function() {
  return this.scheduled_at;
});

testDriveSchema.virtual('time').get(function() {
  if (!this.scheduled_at) return '';
  return new Date(this.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
});

testDriveSchema.index({ scheduled_at: 1, status: 1 });

module.exports = mongoose.model('TestDrive', testDriveSchema);
