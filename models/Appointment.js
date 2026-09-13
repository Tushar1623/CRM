const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
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
  item_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item' 
  },
  // Backward compatibility alias for vehicle_id
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  item_name: { 
    type: String, 
    default: '' 
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
  type: {
    type: String,
    default: 'Appointment' // e.g. test_drive, site_visit, counselling, consultation
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
    default: 'Office / Showroom' 
  },
  status: { 
    type: String, 
    default: 'Scheduled',
    index: true 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  custom_fields: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

appointmentSchema.pre('save', function(next) {
  if (this.vehicle_id && !this.item_id) {
    this.item_id = this.vehicle_id;
  }
  if (this.item_id && !this.vehicle_id) {
    this.vehicle_id = this.item_id;
  }
  if (this.car_name && !this.item_name) {
    this.item_name = this.car_name;
  }
  if (this.item_name && !this.car_name) {
    this.car_name = this.item_name;
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
