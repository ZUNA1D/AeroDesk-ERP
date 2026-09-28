import mongoose from 'mongoose';

const agencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  licenseNo: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'TRIAL', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  subscriptionPlan: {
    type: String,
    enum: ['STARTER', 'GROWTH', 'ENTERPRISE'],
    default: 'GROWTH'
  },
  maxUsers: {
    type: Number,
    default: 15
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

agencySchema.index({ status: 1 });

export const Agency = mongoose.model('Agency', agencySchema);
