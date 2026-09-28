import mongoose from 'mongoose';

const baseOptions = {
  discriminatorKey: 'type',
  collection: 'transactions',
  timestamps: true
};

const transactionSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true
  },
  ref: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'VOIDED'],
    default: 'ACTIVE'
  },
  voidReason: {
    type: String,
    trim: true
  },
  voidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  voidedAt: {
    type: Date
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, baseOptions);

// Compound uniqueness: each agency has its own isolated sequence of refs (e.g. INVT-2026-000001)
transactionSchema.index({ agency: 1, ref: 1 }, { unique: true });
transactionSchema.index({ agency: 1, type: 1, status: 1, date: -1 });
transactionSchema.index({ agency: 1, client: 1, date: -1 });
transactionSchema.index({ agency: 1, supplier: 1, date: -1 });
transactionSchema.index({ agency: 1, date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);

