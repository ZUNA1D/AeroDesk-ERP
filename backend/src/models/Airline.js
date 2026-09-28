import mongoose from 'mongoose';

const airlineSchema = new mongoose.Schema({
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
  iataCode: {
    type: String,
    uppercase: true,
    trim: true
  }
}, {
  timestamps: true
});

airlineSchema.index({ agency: 1, name: 1 }, { unique: true });

export const Airline = mongoose.model('Airline', airlineSchema);

