import mongoose from 'mongoose';

const sectorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
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

export const Sector = mongoose.model('Sector', sectorSchema);
