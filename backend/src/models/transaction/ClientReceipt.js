import mongoose from 'mongoose';
import { Transaction } from './Transaction.js';

const clientReceiptSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  mode: {
    type: String,
    enum: ['CASH', 'BANK', 'MOBILE', 'CARD'],
    default: 'CASH'
  },
  remarks: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  chequeNo: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  }
});

export const ClientReceipt = Transaction.discriminator('CLIENT_RECEIPT', clientReceiptSchema);
