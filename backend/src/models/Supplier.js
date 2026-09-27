import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['PORTAL', 'AGENCY', 'DIRECT'],
    required: true
  },
  isSelf: {
    type: Boolean,
    default: false
  },
  contactPerson: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

supplierSchema.index({ name: 'text', contactPerson: 'text' });

export const Supplier = mongoose.model('Supplier', supplierSchema);
