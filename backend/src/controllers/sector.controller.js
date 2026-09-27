import { Sector } from '../models/Sector.js';
import { Transaction } from '../models/transaction/Transaction.js';

export async function listSectors(req, res, next) {
  try {
    const sectors = await Sector.find().sort({ name: 1 });
    res.json({ sectors });
  } catch (err) {
    next(err);
  }
}

export async function createSector(req, res, next) {
  try {
    const { name, origin, destination } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Sector name is required.' });
    }

    const nameUpper = name.trim().toUpperCase();
    let sector = await Sector.findOne({ name: nameUpper });
    if (sector) {
      return res.status(400).json({ message: `Sector "${nameUpper}" already exists.`, sector });
    }

    sector = await Sector.create({
      name: nameUpper,
      origin: origin?.trim()?.toUpperCase(),
      destination: destination?.trim()?.toUpperCase()
    });

    res.status(201).json({ sector });
  } catch (err) {
    next(err);
  }
}

export async function deleteSector(req, res, next) {
  try {
    const { id } = req.params;
    const sector = await Sector.findById(id);
    if (!sector) {
      return res.status(404).json({ message: 'Sector not found.' });
    }

    const txCount = await Transaction.countDocuments({ 'passengers.sector': sector._id });
    if (txCount > 0) {
      return res.status(409).json({ message: `Cannot delete sector "${sector.name}" as it is referenced in ${txCount} visa invoice(s).` });
    }

    await Sector.deleteOne({ _id: sector._id });
    res.json({ message: `Sector ${sector.name} deleted.` });
  } catch (err) {
    next(err);
  }
}
