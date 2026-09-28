import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    index: true,
    required: function() {
      return this.role !== 'SUPER_ADMIN';
    }
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
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'],
    default: 'STAFF'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.index({ agency: 1, email: 1 });

export const User = mongoose.model('User', userSchema);

