import { Settings } from '../models/Settings.js';
import { Agency } from '../models/Agency.js';
import { writeAuditLog } from '../services/audit.service.js';

export async function getSettings(req, res, next) {
  try {
    let settings = await Settings.findOne({ agency: req.agencyId });
    if (!settings) {
      const agency = await Agency.findById(req.agencyId);
      settings = await Settings.create({
        agency: req.agencyId,
        companyName: agency?.name || 'AeroDesk Agency',
        tagline: 'Travel & Aviation Agency Management ERP',
        address: agency?.address || 'Dhaka, Bangladesh',
        phone: agency?.phone || '+880 1700-000000',
        email: agency?.email || 'admin@aerodesk.com',
        currency: 'BDT'
      });
    }
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    let settings = await Settings.findOne({ agency: req.agencyId });
    if (!settings) {
      settings = new Settings({ agency: req.agencyId });
    }

    const before = settings.toObject();
    const { companyName, tagline, address, phone, email, website, currency, logoUrl } = req.body;

    if (companyName) settings.companyName = companyName.trim();
    if (tagline !== undefined) settings.tagline = tagline?.trim();
    if (address !== undefined) settings.address = address?.trim();
    if (phone !== undefined) settings.phone = phone?.trim();
    if (email !== undefined) settings.email = email?.trim()?.toLowerCase();
    if (website !== undefined) settings.website = website?.trim();
    if (currency !== undefined) settings.currency = currency?.trim()?.toUpperCase();

    if (req.file) {
      settings.logoUrl = `/uploads/${req.file.filename}`;
    } else if (logoUrl !== undefined) {
      settings.logoUrl = logoUrl;
    }

    await settings.save();

    // If companyName was updated, also update Agency.name
    if (companyName) {
      await Agency.findByIdAndUpdate(req.agencyId, { name: companyName.trim() });
    }

    await writeAuditLog({
      agency: req.agencyId,
      entityType: 'Settings',
      entityId: settings._id,
      action: 'UPDATE',
      performedBy: req.user._id,
      details: `Updated agency settings & branding (${settings.companyName})`,
      before,
      after: settings
    });

    res.json({ message: 'Settings updated successfully.', settings });
  } catch (err) {
    next(err);
  }
}
