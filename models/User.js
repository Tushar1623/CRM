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
    default: 'sales_executive', 
    index: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active', 
    index: true 
  }
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.password_hash;
      delete ret.password;
      return ret;
    }
  }
});

// Compare password helper
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password_hash) return false;
  return bcrypt.compare(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('User', userSchema);
