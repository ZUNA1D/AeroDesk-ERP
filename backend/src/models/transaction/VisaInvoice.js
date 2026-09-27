import mongoose from 'mongoose';
import { Transaction } from './Transaction.js';

const visaPassengerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  visaNo: {
    type: String,
    trim: true
  },
  sector: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sector'
  },
  cost: {
    type: Number,
    required: true,
    default: 0
  },
  sell: {
    type: Number,
    required: true,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  }
}, { _id: true });

const visaInvoiceSchema = new mongoose.Schema({
  passengers: [visaPassengerSchema],
  totalBuy: {
    type: Number,
    required: true,
    default: 0
  },
  totalSell: {
    type: Number,
    required: true,
    default: 0
  },
  profit: {
    type: Number,
    required: true,
    default: 0
  }
});

export const VisaInvoice = Transaction.discriminator('VISA_INVOICE', visaInvoiceSchema);
