const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  stock_id: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true,
    index: true 
  },
  registration_number: { 
    type: String, 
    trim: true, 
    uppercase: true 
  },
  brand: { 
    type: String, 
    required: true, 
    trim: true 
  },
  model: { 
    type: String, 
    required: true, 
    trim: true 
  },
  variant: { 
    type: String, 
    trim: true,
    default: '' 
  },
  year: { 
    type: Number, 
    required: true 
  },
  fuel: { 
    type: String, 
    enum: ['petrol', 'diesel', 'cng', 'electric', 'hybrid', 'other'], 
    default: 'petrol' 
  },
  transmission: { 
    type: String, 
    enum: ['manual', 'automatic'], 
    default: 'manual' 
  },
  body_type: { 
    type: String, 
    enum: ['suv', 'sedan', 'hatchback', 'muv', 'coupe', 'other'], 
    default: 'suv' 
  },
  km_driven: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  colour: { 
    type: String, 
    trim: true,
    default: '' 
  },
  purchase_price: { 
    type: Number, 
    default: 0 
  },
  asking_price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  minimum_selling_price: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['available', 'reserved', 'booked', 'sold', 'under_repair'], 
    default: 'available',
    index: true 
  },
  images: [{
    url: String,
    is_primary: { type: Boolean, default: false }
  }],
  notes: { 
    type: String,
    default: '' 
  },
  sold_at: { 
    type: Date 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual compatibility alias
vehicleSchema.virtual('selling_price')
  .get(function() { return this.asking_price; })
  .set(function(v) { this.asking_price = v; });

module.exports = mongoose.model('Vehicle', vehicleSchema);
