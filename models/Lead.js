const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  lead_number: { 
    type: String, 
    required: true,
    unique: true, 
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
    required: true,
    index: true 
  },
  source: { 
    type: String, 
    enum: [
      'walk_in', 'website', 'facebook', 'instagram', 'whatsapp', 'google_ads', 
      'cardekho', 'cars24', 'olx', 'referral', 'phone_call', 'existing_customer', 'other'
    ],
    default: 'walk_in',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['hot', 'warm', 'cold'], 
    default: 'warm',
    index: true 
  },
  status: { 
    type: String, 
    enum: [
      'new', 'contacted', 'interested', 'follow_up', 'test_drive', 
      'negotiation', 'booked', 'won', 'lost'
    ],
    default: 'new',
    index: true 
  },
  interested_vehicle_ids: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle' 
  }],
  // Specific vehicle text representation
  interested_car: {
    type: String,
    trim: true
  },
  requirements: {
    preferred_brands: [{ type: String, trim: true }],
    preferred_models: [{ type: String, trim: true }],
    preferred_fuel_types: [{ type: String, trim: true }],
    preferred_transmission: { type: String, trim: true },
    preferred_body_types: [{ type: String, trim: true }],
    budget_min: { type: Number, min: 0, default: 0 },
    budget_max: { type: Number, min: 0, default: 0 },
    year_from: { type: Number },
    maximum_km: { type: Number },
    preferred_colour: { type: String, trim: true },
    buying_timeline: { 
      type: String, 
      enum: ['immediately', 'within_7_days', 'within_30_days', 'one_to_three_months', 'exploring'],
      default: 'within_30_days' 
    },
    finance_required: { type: Boolean, default: false },
    exchange_vehicle: { type: Boolean, default: false }
  },
  next_follow_up_at: { 
    type: Date, 
    index: true 
  },
  lost_reason: { 
    type: String, 
    enum: [
      'price_too_high', 'bought_elsewhere', 'vehicle_unavailable', 'finance_rejected', 
      'not_interested', 'not_responding', 'requirement_changed', 'purchase_postponed', 'other'
    ]
  },
  lost_note: { 
    type: String,
    trim: true 
  },
  notes: { 
    type: String,
    trim: true 
  },
  closed_at: { 
    type: Date 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for assigned_to_name
leadSchema.virtual('assigned_to_name').get(function() {
  return this.assigned_to?.name || 'Sales Executive';
});

// Virtual for budget_max fallback
leadSchema.virtual('budget_max_val').get(function() {
  return this.requirements?.budget_max || 0;
});

leadSchema.index({ status: 1, priority: 1, createdAt: -1 });
leadSchema.index({ customer_id: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
