import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
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

// Index for search
clientSchema.index({ name: 'text', phone: 'text', passportNo: 'text' });

export const Client = mongoose.model('Client', clientSchema);
