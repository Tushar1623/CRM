const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true, 
    index: true 
  },
  phone: { 
    type: String, 
    trim: true 
  },
  password: { 
    type: String 
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Sales Manager', 'Sales Executive'], 
    default: 'Sales Executive', 
    index: true 
  },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active', 
    index: true 
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema);
