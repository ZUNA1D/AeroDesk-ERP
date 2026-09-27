import { Supplier } from '../models/Supplier.js';
import { Transaction } from '../models/transaction/Transaction.js';
import { writeAuditLog } from '../services/audit.service.js';

export async function listSuppliers(req, res, next) {
  try {
    const { type, active } = req.query;

    const query = {};
    if (type) query.type = type.toUpperCase();
    if (active !== undefined) query.active = active === 'true';

    const suppliers = await Supplier.find(query).sort({ isSelf: -1, type: 1, name: 1 });
    res.json({ suppliers });
  } catch (err) {
    next(err);
  }
}

export async function getSupplierById(req, res, next) {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    const recentTransactions = await Transaction.find({ supplier: supplier._id })
      .sort({ date: -1 })
      .limit(10);

    res.json({ supplier, recentTransactions });
  } catch (err) {
    next(err);
  }
}

export async function createSupplier(req, res, next) {
  try {
    const { name, type, contactPerson, phone, email, creditLimit } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Supplier name and type (PORTAL, AGENCY, DIRECT) are required.' });
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      type: type.toUpperCase(),
      contactPerson: contactPerson?.trim(),
      phone: phone?.trim(),
      email: email?.trim()?.toLowerCase(),
      creditLimit: Number(creditLimit) || 0,
      balance: 0,
      active: true
    });

    await writeAuditLog({
      entityType: 'Supplier',
      entityId: supplier._id,
      action: 'CREATE',
      performedBy: req.user._id,
      details: `Created Supplier ${supplier.name} (${supplier.type})`,
      after: supplier
    });

    res.status(201).json({ supplier });
  } catch (err) {
    next(err);
  }
}

export async function updateSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const { name, contactPerson, phone, email, creditLimit, active } = req.body;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    const before = supplier.toObject();

    if (name) supplier.name = name.trim();
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson?.trim();
    if (phone !== undefined) supplier.phone = phone?.trim();
    if (email !== undefined) supplier.email = email?.trim()?.toLowerCase();
    if (creditLimit !== undefined) supplier.creditLimit = Number(creditLimit) || 0;
    if (active !== undefined && !supplier.isSelf) supplier.active = active;

    await supplier.save();

    await writeAuditLog({
      entityType: 'Supplier',
      entityId: supplier._id,
      action: 'UPDATE',
      performedBy: req.user._id,
      details: `Updated Supplier ${supplier.name}`,
      before,
      after: supplier
    });

    res.json({ supplier });
  } catch (err) {
    next(err);
  }
}

export async function deleteSupplier(req, res, next) {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found.' });
    }

    if (supplier.isSelf) {
      return res.status(400).json({ message: 'The primary IN-HOUSE / DIRECT stock supplier cannot be deleted.' });
    }

    // 409 Conflict guard
    const txCount = await Transaction.countDocuments({ supplier: supplier._id });
    if (txCount > 0) {
      return res.status(409).json({
        message: `Cannot delete supplier "${supplier.name}" because ${txCount} transaction(s) reference it. Please void or reassign them first.`
      });
    }

    const before = supplier.toObject();
    await Supplier.deleteOne({ _id: supplier._id });

    await writeAuditLog({
      entityType: 'Supplier',
      entityId: supplier._id,
      action: 'DELETE',
      performedBy: req.user._id,
      details: `Deleted supplier ${supplier.name}`,
      before
    });

    res.json({ message: `Supplier ${supplier.name} successfully deleted.` });
  } catch (err) {
    next(err);
  }
}
