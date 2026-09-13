const mongoose = require('mongoose');

const testDriveSchema = new mongoose.Schema({
  lead_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Lead' 
  },
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer' 
  },
  customer_name: { 
    type: String, 
    default: '' 
  },
  customer_phone: { 
    type: String, 
    default: '' 
  },
  vehicle_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle' 
  },
  car_name: { 
    type: String, 
    default: '' 
  },
  employee_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  employee_name: { 
    type: String, 
    default: 'Sales Executive' 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  time: { 
    type: String, 
    default: '11:30 AM' 
  },
  scheduled_at: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  location: { 
    type: String, 
    default: 'Showroom' 
  },
  status: { 
    type: String, 
    default: 'Scheduled',
    index: true 
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('TestDrive', testDriveSchema);
