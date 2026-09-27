import mongoose from 'mongoose';

const baseOptions = {
  discriminatorKey: 'type',
  collection: 'transactions',
  timestamps: true
};

const transactionSchema = new mongoose.Schema({
  ref: {
    type: String,
    required: true,
    unique: true,
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

transactionSchema.index({ type: 1, status: 1, date: -1 });
transactionSchema.index({ client: 1, date: -1 });
transactionSchema.index({ supplier: 1, date: -1 });
transactionSchema.index({ date: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
