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
    ref: 'Customer' 
  },
  vehicle_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle', 
    required: true 
  },
  employee_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  scheduled_at: { 
    type: Date, 
    required: true,
    index: true 
  },
  location: { 
    type: String, 
    default: 'Showroom' 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  customer_feedback: { 
    type: String,
    default: '' 
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

testDriveSchema.virtual('employee_name').get(function() {
  return this.employee_id?.name || 'Sales Executive';
});

module.exports = mongoose.model('TestDrive', testDriveSchema);
