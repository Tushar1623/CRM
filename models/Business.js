const mongoose = require('mongoose');

const BUSINESS_TEMPLATES = {
  used_car: {
    name: 'Motorwise Dealership',
    business_type: 'used_car',
    labels: {
      customer: 'Customer',
      lead: 'Lead',
      item: 'Car',
      item_plural: 'Inventory',
      appointment: 'Test Drive',
      appointment_plural: 'Test Drives',
      deal: 'Booking & Sale'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  },
  real_estate: {
    name: 'Prime Realty Estates',
    business_type: 'real_estate',
    labels: {
      customer: 'Client',
      lead: 'Lead',
      item: 'Property',
      item_plural: 'Properties',
      appointment: 'Site Visit',
      appointment_plural: 'Site Visits',
      deal: 'Booking & Sale'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  },
  education: {
    name: 'Apex Academy & Admissions',
    business_type: 'education',
    labels: {
      customer: 'Student',
      lead: 'Enquiry',
      item: 'Course',
      item_plural: 'Courses',
      appointment: 'Counselling',
      appointment_plural: 'Counselling Sessions',
      deal: 'Admission'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  },
  service: {
    name: 'ProService Experts',
    business_type: 'service',
    labels: {
      customer: 'Client',
      lead: 'Enquiry',
      item: 'Service',
      item_plural: 'Services',
      appointment: 'Appointment',
      appointment_plural: 'Appointments',
      deal: 'Job / Contract'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  },
  general_sales: {
    name: 'Global B2B Sales',
    business_type: 'general_sales',
    labels: {
      customer: 'Account / Contact',
      lead: 'Lead',
      item: 'Product',
      item_plural: 'Products',
      appointment: 'Meeting',
      appointment_plural: 'Meetings',
      deal: 'Deal'
    },
    modules: {
      inventory: true,
      appointments: true,
      deals: true
    }
  }
};

const businessSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    default: 'Motorwise Dealership' 
  },
  business_type: { 
    type: String, 
    enum: ['used_car', 'real_estate', 'education', 'service', 'general_sales'], 
    default: 'used_car' 
  },
  labels: {
    customer: { type: String, default: 'Customer' },
    lead: { type: String, default: 'Lead' },
    item: { type: String, default: 'Car' },
    item_plural: { type: String, default: 'Inventory' },
    appointment: { type: String, default: 'Test Drive' },
    appointment_plural: { type: String, default: 'Test Drives' },
    deal: { type: String, default: 'Booking & Sale' }
  },
  modules: {
    inventory: { type: Boolean, default: true },
    appointments: { type: Boolean, default: true },
    deals: { type: Boolean, default: true }
  },
  custom_fields_schema: [{
    key: String,
    label: String,
    type: { type: String, default: 'text' },
    options: [String]
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

businessSchema.statics.TEMPLATES = BUSINESS_TEMPLATES;

module.exports = mongoose.model('Business', businessSchema);
