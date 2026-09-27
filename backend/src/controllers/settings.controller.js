import { Settings } from '../models/Settings.js';
import { writeAuditLog } from '../services/audit.service.js';

export async function getSettings(req, res, next) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: 'AeroDesk',
        tagline: 'Travel & Aviation Agency Management ERP',
        address: 'Dhaka, Bangladesh',
        phone: '+880 1700-000000',
        email: 'admin@aerodesk.com',
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
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
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

    await writeAuditLog({
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
