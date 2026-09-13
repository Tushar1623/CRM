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
    uppercase: true,
    index: true
  },
  brand: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  model: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  variant: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: 2030,
    index: true
  },
  registration_year: {
    type: Number
  },
  fuel: {
    type: String,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'Other'],
    required: true,
    default: 'Petrol'
  },
  transmission: {
    type: String,
    enum: ['Manual', 'Automatic'],
    default: 'Manual'
  },
  body_type: {
    type: String,
    enum: ['SUV', 'Sedan', 'Hatchback', 'MUV', 'Coupe', 'Other'],
    default: 'SUV'
  },
  km_driven: {
    type: Number,
    required: true,
    min: 0
  },
  owners: {
    type: Number,
    default: 1,
    min: 1
  },
  colour: {
    type: String,
    trim: true
  },
  registration_city: {
    type: String,
    trim: true
  },
  insurance_validity: {
    type: Date
  },
  purchase_price: {
    type: Number,
    min: 0
  },
  asking_price: {
    type: Number,
    min: 0
  },
  selling_price: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  minimum_selling_price: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Reserved', 'Test Drive', 'Booked', 'Sold', 'Under Inspection', 'Under Repair'],
    default: 'Available',
    index: true
  },
  images: [{
    url: { type: String, required: true },
    category: { type: String, default: 'General' },
    is_primary: { type: Boolean, default: false }
  }],
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes for inventory filtering & search
vehicleSchema.index({ brand: 1, model: 1, status: 1 });
vehicleSchema.index({ selling_price: 1, status: 1 });
vehicleSchema.index({ brand: 'text', model: 'text', stock_id: 'text', registration_number: 'text' });

module.exports = mongoose.model('Vehicle', vehicleSchema);
