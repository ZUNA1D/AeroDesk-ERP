import { Agency } from '../models/Agency.js';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';
import { Transaction } from '../models/transaction/Transaction.js';
import { writeAuditLog } from '../services/audit.service.js';

/**
 * Get current agency workspace profile
 */
export async function getAgencyProfile(req, res, next) {
  try {
    const agency = await Agency.findById(req.agencyId).populate('owner', 'name email');
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found.' });
    }

    const [userCount, clientCount, txCount] = await Promise.all([
      User.countDocuments({ agency: agency._id, active: true }),
      Client.countDocuments({ agency: agency._id }),
      Transaction.countDocuments({ agency: agency._id })
    ]);

    res.json({
      agency,
      stats: {
        activeUsers: userCount,
        maxUsers: agency.maxUsers,
        totalClients: clientCount,
        totalTransactions: txCount
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update current agency profile
 */
export async function updateAgencyProfile(req, res, next) {
  try {
    const { name, phone, email, address, licenseNo } = req.body;
    const agency = await Agency.findById(req.agencyId);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found.' });
    }

    const before = agency.toObject();

    if (name) agency.name = name.trim();
    if (phone !== undefined) agency.phone = phone?.trim();
    if (email !== undefined) agency.email = email?.trim()?.toLowerCase();
    if (address !== undefined) agency.address = address?.trim();
    if (licenseNo !== undefined) agency.licenseNo = licenseNo?.trim();

    await agency.save();

    await writeAuditLog({
      agency: agency._id,
      entityType: 'Agency',
      entityId: agency._id,
      action: 'UPDATE',
      performedBy: req.user._id,
      details: `Updated agency profile for ${agency.name}`,
      before,
      after: agency
    });

    res.json({ message: 'Agency profile updated successfully.', agency });
  } catch (err) {
    next(err);
  }
}

/**
 * Platform SUPER_ADMIN: List all agencies
 */
export async function listAllAgencies(req, res, next) {
  try {
    const agencies = await Agency.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    const agencyStats = await Promise.all(
      agencies.map(async (ag) => {
        const [users, clients, txs] = await Promise.all([
          User.countDocuments({ agency: ag._id }),
          Client.countDocuments({ agency: ag._id }),
          Transaction.countDocuments({ agency: ag._id })
        ]);
        return {
          ...ag.toObject(),
          stats: { users, clients, txs }
        };
      })
    );

    res.json({ agencies: agencyStats });
  } catch (err) {
    next(err);
  }
}

/**
 * Platform SUPER_ADMIN: Update agency status / plan (suspend, activate, upgrade)
 */
export async function updateAgencyStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, subscriptionPlan, maxUsers } = req.body;

    const agency = await Agency.findById(id);
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found.' });
    }

    if (status) agency.status = status;
    if (subscriptionPlan) agency.subscriptionPlan = subscriptionPlan;
    if (maxUsers !== undefined) agency.maxUsers = Number(maxUsers);

    await agency.save();

    await writeAuditLog({
      agency: agency._id,
      entityType: 'Agency',
      entityId: agency._id,
      action: 'UPDATE',
      performedBy: req.user._id,
      details: `SUPER_ADMIN modified agency ${agency.name}: status=${agency.status}, plan=${agency.subscriptionPlan}`
    });

    res.json({ message: 'Agency status updated successfully.', agency });
  } catch (err) {
    next(err);
  }
}
