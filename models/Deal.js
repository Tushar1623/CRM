const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  deal_number: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    index: true 
  },
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
  salesperson_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  final_selling_price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  booking_amount: { 
    type: Number, 
    default: 0 
  },
  amount_received: { 
    type: Number, 
    default: 0 
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'partial', 'paid'], 
    default: 'pending' 
  },
  status: { 
    type: String, 
    enum: ['booked', 'delivered', 'cancelled'], 
    default: 'booked',
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

dealSchema.virtual('balance').get(function() {
  return (this.final_selling_price || 0) - (this.amount_received || this.booking_amount || 0);
});

dealSchema.virtual('selling_price')
  .get(function() { return this.final_selling_price; })
  .set(function(v) { this.final_selling_price = v; });

dealSchema.virtual('deal_status')
  .get(function() { return this.status; })
  .set(function(v) { this.status = v; });

module.exports = mongoose.model('Deal', dealSchema);
