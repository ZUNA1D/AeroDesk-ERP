import mongoose from 'mongoose';

const sectorSchema = new mongoose.Schema({
  agency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    default: null,
    index: true
  },
  name: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  origin: {
    type: String,
    trim: true,
    uppercase: true
  },
  destination: {
    type: String,
    trim: true,
    uppercase: true
  }
}, {
  timestamps: true
});

sectorSchema.index({ agency: 1, name: 1 }, { unique: true });

export const Sector = mongoose.model('Sector', sectorSchema);

