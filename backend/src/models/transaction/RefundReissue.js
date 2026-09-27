import mongoose from 'mongoose';
import { Transaction } from './Transaction.js';

const refundReissueSchema = new mongoose.Schema({
  parentTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  clientRefundAmount: {
    type: Number,
    default: 0
  },
  supplierRefundAmount: {
    type: Number,
    default: 0
  },
  serviceCharge: {
    type: Number,
    default: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  }
});

export const Refund = Transaction.discriminator('REFUND', refundReissueSchema);
export const Reissue = Transaction.discriminator('REISSUE', refundReissueSchema);
