import { Airline } from '../models/Airline.js';
import { Transaction } from '../models/transaction/Transaction.js';

export async function listAirlines(req, res, next) {
  try {
    const airlines = await Airline.find().sort({ name: 1 });
    res.json({ airlines });
  } catch (err) {
    next(err);
  }
}

export async function createAirline(req, res, next) {
  try {
    const { name, iataCode } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Airline name is required.' });
    }

    const nameUpper = name.trim().toUpperCase();
    let airline = await Airline.findOne({ name: nameUpper });
    if (airline) {
      return res.status(400).json({ message: `Airline "${nameUpper}" already exists.`, airline });
    }

    airline = await Airline.create({
      name: nameUpper,
      iataCode: iataCode?.trim()?.toUpperCase()
    });

    res.status(201).json({ airline });
  } catch (err) {
    next(err);
  }
}

export async function deleteAirline(req, res, next) {
  try {
    const { id } = req.params;
    const airline = await Airline.findById(id);
    if (!airline) {
      return res.status(404).json({ message: 'Airline not found.' });
    }

    // Check if referenced
    const txCount = await Transaction.countDocuments({ 'passengers.airline': airline._id });
    if (txCount > 0) {
      return res.status(409).json({ message: `Cannot delete airline "${airline.name}" as it is referenced in ${txCount} ticket invoice(s).` });
    }

    await Airline.deleteOne({ _id: airline._id });
    res.json({ message: `Airline ${airline.name} deleted.` });
  } catch (err) {
    next(err);
  }
}
