const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  deal_number: { 
    type: String, 
    unique: true, 
    sparse: true, 
    uppercase: true, 
    index: true 
  },
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
  salesperson_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  salesperson_name: { 
    type: String, 
    default: 'Amit Sharma' 
  },
  asking_price: { 
    type: Number, 
    min: 0 
  },
  negotiated_price: { 
    type: Number, 
    min: 0 
  },
  selling_price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  booking_amount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  payment_method: { 
    type: String, 
    enum: ['Cash', 'Bank Transfer / NEFT', 'Cheque', 'UPI', 'Finance / Auto Loan', 'Other'],
    default: 'UPI'
  },
  finance_status: { 
    type: String, 
    enum: ['Not Applicable', 'Pending', 'Applied', 'Approved', 'Disbursed', 'Rejected'],
    default: 'Not Applicable'
  },
  payment_status: { 
    type: String, 
    enum: ['Pending', 'Partial', 'Completed'], 
    default: 'Pending',
    index: true 
  },
  deal_status: { 
    type: String, 
    enum: ['Negotiation', 'Booking Pending', 'Booked', 'Payment Pending', 'Payment Completed', 'Delivered', 'Cancelled'],
    default: 'Booked',
    index: true 
  },
  deal_date: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  expected_delivery_date: { 
    type: Date 
  },
  delivered_date: { 
    type: Date 
  },
  notes: { 
    type: String 
  }
}, { 
  timestamps: true 
});

dealSchema.index({ customer_id: 1, deal_date: -1 });
dealSchema.index({ deal_status: 1, deal_date: -1 });

module.exports = mongoose.model('Deal', dealSchema);
