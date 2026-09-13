const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
  password_hash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'sales_executive'], 
    default: 'sales_executive' 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password_hash;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);
