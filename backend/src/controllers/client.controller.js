import { Client } from '../models/Client.js';
import { Transaction } from '../models/transaction/Transaction.js';
import { writeAuditLog } from '../services/audit.service.js';

export async function listClients(req, res, next) {
  try {
    const { search, page = 1, limit = 50, sort = 'name' } = req.query;

    const query = { agency: req.agencyId };
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = [
        {
          $or: [
            { name: searchRegex },
            { phone: searchRegex },
            { email: searchRegex },
            { passportNo: searchRegex },
            { nid: searchRegex }
          ]
        }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [clients, total] = await Promise.all([
      Client.find(query)
        .sort(sort === 'due' ? { currentDue: -1 } : { name: 1 })
        .skip(skip)
        .limit(limitNum),
      Client.countDocuments(query)
    ]);

    res.json({
      clients,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getClientById(req, res, next) {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ _id: id, agency: req.agencyId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    const recentTransactions = await Transaction.find({ client: client._id, agency: req.agencyId })
      .sort({ date: -1 })
      .limit(10);

    res.json({ client, recentTransactions });
  } catch (err) {
    next(err);
  }
}

export async function createClient(req, res, next) {
  try {
    const { name, phone, email, address, passportNo, nid, passportExpiry, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Client name is required.' });
    }

    const nameUpper = name.trim().toUpperCase();

    // Check if client with identical uppercase name exists within this agency
    const existing = await Client.findOne({ agency: req.agencyId, name: nameUpper });
    if (existing) {
      return res.status(400).json({ message: `A client named "${nameUpper}" already exists.`, client: existing });
    }

    const client = await Client.create({
      agency: req.agencyId,
      name: nameUpper,
      phone: phone?.trim(),
      email: email?.trim()?.toLowerCase(),
      address: address?.trim(),
      passportNo: passportNo?.trim()?.toUpperCase(),
      nid: nid?.trim(),
      passportExpiry: passportExpiry ? new Date(passportExpiry) : undefined,
      notes: notes?.trim(),
      currentDue: 0,
      createdBy: req.user._id
    });

    await writeAuditLog({
      agency: req.agencyId,
      entityType: 'Client',
      entityId: client._id,
      action: 'CREATE',
      performedBy: req.user._id,
      details: `Created Client ${client.name}`,
      after: client
    });

    res.status(201).json({ client });
  } catch (err) {
    next(err);
  }
}

export async function updateClient(req, res, next) {
  try {
    const { id } = req.params;
    const { name, phone, email, address, passportNo, nid, passportExpiry, notes } = req.body;

    const client = await Client.findOne({ _id: id, agency: req.agencyId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    const before = client.toObject();

    if (name) client.name = name.trim().toUpperCase();
    if (phone !== undefined) client.phone = phone?.trim();
    if (email !== undefined) client.email = email?.trim()?.toLowerCase();
    if (address !== undefined) client.address = address?.trim();
    if (passportNo !== undefined) client.passportNo = passportNo?.trim()?.toUpperCase();
    if (nid !== undefined) client.nid = nid?.trim();
    if (passportExpiry !== undefined) client.passportExpiry = passportExpiry ? new Date(passportExpiry) : undefined;
    if (notes !== undefined) client.notes = notes?.trim();

    await client.save();

    await writeAuditLog({
      agency: req.agencyId,
      entityType: 'Client',
      entityId: client._id,
      action: 'UPDATE',
      performedBy: req.user._id,
      details: `Updated details for Client ${client.name}`,
      before,
      after: client
    });

    res.json({ client });
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(req, res, next) {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ _id: id, agency: req.agencyId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    // 409 Conflict guard: Check if any transactions reference this client
    const txCount = await Transaction.countDocuments({ client: client._id, agency: req.agencyId });
    if (txCount > 0) {
      return res.status(409).json({
        message: `Cannot delete client "${client.name}" because ${txCount} transaction(s) reference this client. Please void or reassign them first.`
      });
    }

    const before = client.toObject();
    await Client.deleteOne({ _id: client._id, agency: req.agencyId });

    await writeAuditLog({
      agency: req.agencyId,
      entityType: 'Client',
      entityId: client._id,
      action: 'DELETE',
      performedBy: req.user._id,
      details: `Deleted client ${client.name}`,
      before
    });

    res.json({ message: `Client ${client.name} successfully deleted.` });
  } catch (err) {
    next(err);
  }
}

export async function uploadClientDocument(req, res, next) {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ _id: id, agency: req.agencyId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const doc = {
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    client.documents.push(doc);
    await client.save();

    res.json({ message: 'Document uploaded successfully.', document: doc, client });
  } catch (err) {
    next(err);
  }
}
