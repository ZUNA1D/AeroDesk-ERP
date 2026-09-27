import mongoose from 'mongoose';

const airlineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
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

export const Airline = mongoose.model('Airline', airlineSchema);
