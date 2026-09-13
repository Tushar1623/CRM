const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  deal_number: { 
    type: String, 
    required: true,
    unique: true, 
    uppercase: true,
    trim: true,
    index: true 
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
  vehicle_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle' 
  },
  car_name: { 
    type: String, 
    default: '' 
  },
  salesperson_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  salesperson_name: { 
    type: String, 
    default: 'Amit Sharma' 
  },
  selling_price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  booking_amount: { 
    type: Number, 
    default: 25000 
  },
  payment_status: { 
    type: String, 
    default: 'Pending' 
  },
  deal_status: { 
    type: String, 
    default: 'Booked',
    index: true 
  },
  booking_date: { 
    type: Date, 
    default: Date.now 
  },
  delivered_at: { 
    type: Date 
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

// Alias virtual for status
dealSchema.virtual('status')
  .get(function() { return this.deal_status; })
  .set(function(v) { this.deal_status = v; });

dealSchema.virtual('final_selling_price')
  .get(function() { return this.selling_price; })
  .set(function(v) { this.selling_price = v; });

module.exports = mongoose.model('Deal', dealSchema);
