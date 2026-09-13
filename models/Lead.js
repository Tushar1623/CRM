const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  lead_number: { 
    type: String, 
    unique: true, 
    sparse: true, 
    uppercase: true, 
    index: true 
  },
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true, 
    index: true 
  },
  assigned_to: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    index: true 
  },
  assigned_to_name: { 
    type: String, 
    default: 'Amit Sharma' 
  },
  
  // Specific vehicle interest (car text or inventory ref)
  interested_car: { 
    type: String, 
    trim: true 
  },
  interested_vehicle_ids: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle' 
  }],

  // Customer Requirement Preferences (PRD Section 13)
  preferred_brand: [{ 
    type: String, 
    trim: true 
  }],
  preferred_fuel: [{ 
    type: String, 
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'] 
  }],
  preferred_transmission: { 
    type: String, 
    enum: ['Manual', 'Automatic', 'Any'], 
    default: 'Any' 
  },
  preferred_body_type: [{ 
    type: String 
  }],
  budget_min: { 
    type: Number, 
    min: 0 
  },
  budget_max: { 
    type: Number, 
    min: 0 
  },
  buying_timeline: { 
    type: String, 
    enum: ['Immediately', 'Within 7 Days', 'Within 30 Days', '1-3 Months', 'Just Exploring'], 
    default: 'Within 30 Days' 
  },
  
  source: { 
    type: String, 
    enum: [
      'Walk-in', 'Website', 'Facebook', 'Instagram', 'WhatsApp', 'Google Ads', 
      'CarDekho', 'Cars24', 'OLX', 'Referral', 'Phone Call', 'Existing Customer', 'Other'
    ],
    default: 'Walk-in',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['Hot', 'Warm', 'Cold'], 
    default: 'Warm',
    index: true 
  },
  status: { 
    type: String, 
    enum: [
      'New Lead', 'Contacted', 'Interested', 'Follow-Up', 'Test Drive Scheduled', 
      'Test Drive Completed', 'Negotiation', 'Booking', 'Sold / Won', 'Lost'
    ],
    default: 'New Lead',
    index: true 
  },
  
  next_followup_at: { 
    type: Date, 
    index: true 
  },
  lost_reason: { 
    type: String, 
    enum: [
      'Price too high', 'Bought from competitor', 'Car unavailable', 'Loan rejected', 
      'Customer not interested', 'Customer not responding', 'Requirement changed', 
      'Purchase postponed', 'Other'
    ]
  },
  notes: { 
    type: String 
  }
}, { 
  timestamps: true 
});

leadSchema.index({ status: 1, priority: 1, createdAt: -1 });
leadSchema.index({ customer_id: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
