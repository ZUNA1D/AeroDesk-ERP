import mongoose from 'mongoose';
import { Transaction } from './Transaction.js';

const passengerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  ticketNo: {
    type: String,
    trim: true
  },
  pnr: {
    type: String,
    uppercase: true,
    trim: true
  },
  airline: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airline'
  },
  route: {
    type: String,
    uppercase: true,
    trim: true
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

const ticketInvoiceSchema = new mongoose.Schema({
  passengers: [passengerSchema],
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

export const TicketInvoice = Transaction.discriminator('TICKET_INVOICE', ticketInvoiceSchema);
