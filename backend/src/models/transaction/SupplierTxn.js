import mongoose from 'mongoose';
import { Transaction } from './Transaction.js';

const supplierTxnSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  subtype: {
    type: String,
    enum: ['DEPOSIT', 'PAYMENT', 'ADM', 'ACM'],
    default: 'DEPOSIT'
  },
  remarks: {
    type: String,
    trim: true
  },
  bspRef: {
    type: String,
    trim: true
  },
  mode: {
    type: String,
    enum: ['CASH', 'BANK', 'ONLINE', 'CHEQUE'],
    default: 'BANK'
  }
});

// We register discriminators for each supplier txn type or base SupplierTxn
export const SupplierDeposit = Transaction.discriminator('SUPPLIER_DEPOSIT', supplierTxnSchema);
export const SupplierPayment = Transaction.discriminator('SUPPLIER_PAYMENT', supplierTxnSchema);
export const SupplierDebitMemo = Transaction.discriminator('SUPPLIER_DEBIT_MEMO', supplierTxnSchema);
export const SupplierCreditMemo = Transaction.discriminator('SUPPLIER_CREDIT_MEMO', supplierTxnSchema);
