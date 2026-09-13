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
  year: { 
    type: Number, 
    required: true,
    default: 2021 
  },
  fuel: { 
    type: String, 
    default: 'Petrol' 
  },
  transmission: { 
    type: String, 
    default: 'Manual' 
  },
  km_driven: { 
    type: Number, 
    default: 35000 
  },
  selling_price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  status: { 
    type: String, 
    default: 'Available',
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

// Virtual compatibility alias for asking_price
vehicleSchema.virtual('asking_price')
  .get(function() { return this.selling_price; })
  .set(function(v) { this.selling_price = v; });

module.exports = mongoose.model('Vehicle', vehicleSchema);
