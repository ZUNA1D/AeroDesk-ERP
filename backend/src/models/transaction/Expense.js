import mongoose from 'mongoose';
import { Transaction } from './Transaction.js';

const expenseSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  remarks: {
    type: String,
    trim: true
  },
  paidFrom: {
    type: String,
    enum: ['CASH', 'BANK', 'PETTY_CASH'],
    default: 'CASH'
  }
});

export const Expense = Transaction.discriminator('EXPENSE', expenseSchema);
