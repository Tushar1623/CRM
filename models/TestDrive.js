const mongoose = require('mongoose');

const testDriveSchema = new mongoose.Schema({
  lead_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead', 
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
    ref: 'User' 
  },
  employee_name: { 
    type: String, 
    default: 'Amit Sharma' 
  },
  date: { 
    type: Date, 
    required: true, 
    index: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    enum: ['Showroom', 'Customer Home', 'Customer Office', 'Other'], 
    default: 'Showroom' 
  },
  driving_license_no: { 
    type: String, 
    trim: true 
  },
  customer_feedback: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show', 'Rescheduled'],
    default: 'Scheduled',
    index: true 
  }
}, { 
  timestamps: true 
});

testDriveSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('TestDrive', testDriveSchema);
