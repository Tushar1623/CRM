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
  salesperson_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  asking_price: { 
    type: Number, 
    min: 0,
    default: 0 
  },
  customer_offer: { 
    type: Number, 
    min: 0,
    default: 0 
  },
  final_selling_price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  booking_amount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  amount_received: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  payment_method: { 
    type: String, 
    enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'finance', 'other'],
    default: 'upi'
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'partial', 'paid', 'refunded'], 
    default: 'pending',
    index: true 
  },
  finance_status: { 
    type: String, 
    enum: ['not_applicable', 'pending', 'applied', 'approved', 'disbursed', 'rejected'],
    default: 'not_applicable'
  },
  status: { 
    type: String, 
    enum: ['negotiation', 'booking_pending', 'booked', 'payment_pending', 'payment_completed', 'delivered', 'cancelled'],
    default: 'booked',
    index: true 
  },
  booking_date: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  expected_delivery_date: { 
    type: Date 
  },
  delivered_at: { 
    type: Date 
  },
  notes: { 
    type: String,
    trim: true 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculated balance = final_selling_price - amount_received
dealSchema.virtual('balance').get(function() {
  return (this.final_selling_price || 0) - (this.amount_received || this.booking_amount || 0);
});

// Virtual compatibility aliases
dealSchema.virtual('selling_price')
  .get(function() { return this.final_selling_price; })
  .set(function(v) { this.final_selling_price = v; });

dealSchema.virtual('deal_status')
  .get(function() { return this.status; })
  .set(function(v) { this.status = v; });

dealSchema.virtual('salesperson_name').get(function() {
  return this.salesperson_id?.name || 'Sales Executive';
});

dealSchema.index({ customer_id: 1, booking_date: -1 });
dealSchema.index({ status: 1, booking_date: -1 });

module.exports = mongoose.model('Deal', dealSchema);
