import mongoose from 'mongoose';

const expenseCategorySchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

expenseCategorySchema.index({ agency: 1, name: 1 }, { unique: true });

export const ExpenseCategory = mongoose.model('ExpenseCategory', expenseCategorySchema);

