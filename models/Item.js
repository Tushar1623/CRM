const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
  name: { 
    type: String, 
    trim: true,
    default: '' 
  },
  code: { 
    type: String, 
    trim: true,
    index: true 
  },
  category: { 
    type: String, 
    default: 'General' 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0,
    default: 0 
  },
  status: { 
    type: String, 
    default: 'Available',
    index: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  // Industry-specific flexible attributes (automotive, real estate, education, etc.)
  custom_fields: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },

  // Direct automotive fields for backward compatibility
  brand: { type: String, trim: true, default: '' },
  model: { type: String, trim: true, default: '' },
  year: { type: Number, default: 2022 },
  fuel: { type: String, default: 'Petrol' },
  transmission: { type: String, default: 'Manual' },
  km_driven: { type: Number, default: 30000 },
  stock_id: { type: String, trim: true, default: '' },
  selling_price: { type: Number }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Sync aliases
itemSchema.pre('save', function(next) {
  if (this.brand && this.model && !this.name) {
    this.name = `${this.brand} ${this.model}`.trim();
  }
  if (this.stock_id && !this.code) {
    this.code = this.stock_id;
  }
  if (this.selling_price && !this.price) {
    this.price = this.selling_price;
  }
  if (this.price && !this.selling_price) {
    this.selling_price = this.price;
  }
  next();
});

itemSchema.virtual('asking_price')
  .get(function() { return this.price || this.selling_price; })
  .set(function(v) { this.price = v; this.selling_price = v; });

module.exports = mongoose.model('Item', itemSchema);
