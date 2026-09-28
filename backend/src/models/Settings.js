import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    unique: true,
    index: true
  },
  companyName: {
    type: String,
    default: 'AeroDesk',
    trim: true
  },
  tagline: {
    type: String,
    default: 'Travel & Aviation Agency Management ERP',
    trim: true
  },
  logoUrl: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: 'Dhaka, Bangladesh',
    trim: true
  },
  phone: {
    type: String,
    default: '+880 1700-000000',
    trim: true
  },
  email: {
    type: String,
    default: 'admin@aerodesk.com',
    lowercase: true,
    trim: true
  },
  website: {
    type: String,
    default: 'https://aerodesk.app',
    trim: true
  },
  currency: {
    type: String,
    default: 'BDT',
    uppercase: true
  }
}, {
  timestamps: true
});

export const Settings = mongoose.model('Settings', settingsSchema);

