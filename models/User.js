const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business'
  },
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
    trim: true,
    default: '' 
  },
  password_hash: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    default: 'admin' 
  },
  status: { 
    type: String, 
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
