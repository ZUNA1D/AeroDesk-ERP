import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    uppercase: true,
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
  address: {
    type: String,
    trim: true
  },
  passportNo: {
    type: String,
    trim: true,
    uppercase: true
  },
  nid: {
    type: String,
    trim: true
  },
  passportExpiry: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  currentDue: {
    type: Number,
    default: 0
  },
  documents: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for search scoped by agency
clientSchema.index({ agency: 1, name: 1 });
clientSchema.index({ agency: 1, phone: 1 });
clientSchema.index({ agency: 1, passportNo: 1 });
clientSchema.index({ agency: 1, currentDue: -1 });

export const Client = mongoose.model('Client', clientSchema);

