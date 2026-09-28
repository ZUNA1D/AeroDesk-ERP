import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { Agency } from '../models/Agency.js';
import { Settings } from '../models/Settings.js';
import { Supplier } from '../models/Supplier.js';
import { User } from '../models/User.js';
import { Airline } from '../models/Airline.js';
import { Sector } from '../models/Sector.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';

async function seed() {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    // 1. Platform Root Super Admin (Platform Owner Only)
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@aerodesk.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadmin123';
    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(superAdminPassword, salt);
      superAdmin = await User.create({
        name: 'Platform Super Admin',
        email: superAdminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        active: true,
        agency: null
      });
      console.log(`👑 Platform Super Admin created: ${superAdminEmail} (password: ${superAdminPassword})`);
    } else {
      console.log(`ℹ️ Platform Super Admin already exists: ${superAdminEmail}`);
    }

    // 2. Seed or Get Demo Agency
    let agency = await Agency.findOne({ slug: 'skyline-travels' });
    if (!agency) {
      agency = await Agency.create({
        name: 'SKYLINE TRAVELS & TOURS',
        slug: 'skyline-travels',
        email: 'skyline@aerodesk.app',
        phone: '+880 1711-000000',
        address: 'Gulshan-2, Dhaka, Bangladesh',
        subscriptionPlan: 'ENTERPRISE',
        maxUsers: 25,
        status: 'ACTIVE'
      });
      console.log(`✅ Demo Agency workspace created: ${agency.name} (${agency.slug})`);
    } else {
      console.log(`ℹ️ Demo Agency already exists: ${agency.name}`);
    }

    // 2. Agency Admin User
    const adminEmail = 'admin@aerodesk.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      admin = await User.create({
        agency: agency._id,
        name: 'Skyline Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        active: true
      });
      agency.owner = admin._id;
      await agency.save();
      console.log(`✅ Default agency admin created: ${adminEmail} (password: admin123)`);
    } else {
      admin.agency = agency._id;
      await admin.save();
      console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
    }

    // 3. Agency Settings
    let settings = await Settings.findOne({ agency: agency._id });
    if (!settings) {
      settings = await Settings.create({
        agency: agency._id,
        companyName: 'Skyline Travels & Tours',
        tagline: 'Premier Travel & Aviation Agency Management ERP',
        address: 'Gulshan-2, Dhaka, Bangladesh',
        phone: '+880 1711-000000',
        email: 'admin@aerodesk.com',
        website: 'https://skyline.aerodesk.app',
        currency: 'BDT'
      });
      console.log('✅ Settings seeded for Skyline Travels');
    }

    // 4. In-House / DIRECT Supplier
    let directSupplier = await Supplier.findOne({ agency: agency._id, isSelf: true });
    if (!directSupplier) {
      directSupplier = await Supplier.create({
        agency: agency._id,
        name: 'IN-HOUSE / OWN STOCK',
        type: 'DIRECT',
        isSelf: true,
        contactPerson: 'Internal Inventory',
        phone: '+880 1700-000000',
        email: 'stock@aerodesk.com',
        balance: 0,
        active: true
      });
      console.log('✅ In-house DIRECT supplier created for Skyline');
    }

    // 5. Sample Suppliers for this Agency
    const portalSuppliers = [
      { name: 'SABRE / BSP WALLET', type: 'PORTAL', contactPerson: 'BSP Desk', phone: '+880 1711-000001', balance: 500000 },
      { name: 'AMADEUS B2B WALLET', type: 'PORTAL', contactPerson: 'Amadeus Support', phone: '+880 1711-000002', balance: 250000 },
      { name: 'FLYHUB B2B PORTAL', type: 'PORTAL', contactPerson: 'Flyhub Sales', phone: '+880 1711-000003', balance: 150000 }
    ];

    for (const sup of portalSuppliers) {
      const exists = await Supplier.findOne({ agency: agency._id, name: sup.name });
      if (!exists) {
        await Supplier.create({ ...sup, agency: agency._id });
        console.log(`✅ Portal supplier created: ${sup.name}`);
      }
    }

    const agencySuppliers = [
      { name: 'DYNAMIC TRAVELS LTD', type: 'AGENCY', contactPerson: 'Mr. Rafiq', phone: '+880 1811-000001', creditLimit: 500000, balance: 120000 },
      { name: 'HORIZON AVIATION CONSOLIDATOR', type: 'AGENCY', contactPerson: 'Mr. Kamal', phone: '+880 1811-000002', creditLimit: 1000000, balance: 340000 }
    ];

    for (const sup of agencySuppliers) {
      const exists = await Supplier.findOne({ agency: agency._id, name: sup.name });
      if (!exists) {
        await Supplier.create({ ...sup, agency: agency._id });
        console.log(`✅ Agency supplier created: ${sup.name}`);
      }
    }

    // 6. Seed Expense Categories
    const categories = [
      'Office Rent',
      'Utilities (Electricity / Water / Internet)',
      'Staff Salaries & Allowances',
      'Software & Subscriptions',
      'Office Supplies & Stationery',
      'Entertainment & Hospitality',
      'Bank & Merchant Charges',
      'Miscellaneous'
    ];
    for (const catName of categories) {
      const exists = await ExpenseCategory.findOne({ agency: agency._id, name: catName });
      if (!exists) {
        await ExpenseCategory.create({ agency: agency._id, name: catName });
      }
    }
    console.log('✅ Expense categories seeded.');

    // 7. Global Airlines
    const airlines = [
      { name: 'BIMAN BANGLADESH AIRLINES', iataCode: 'BG' },
      { name: 'SAUDIA AIRLINES', iataCode: 'SV' },
      { name: 'EMIRATES', iataCode: 'EK' },
      { name: 'QATAR AIRWAYS', iataCode: 'QR' },
      { name: 'US-BANGLA AIRLINES', iataCode: 'BS' },
      { name: 'AIR ARABIA', iataCode: 'G9' },
      { name: 'FLYDUBAI', iataCode: 'FZ' },
      { name: 'GULF AIR', iataCode: 'GF' },
      { name: 'KUWAIT AIRWAYS', iataCode: 'KU' },
      { name: 'MALAYSIA AIRLINES', iataCode: 'MH' }
    ];

    for (const air of airlines) {
      const exists = await Airline.findOne({ name: air.name, agency: null });
      if (!exists) {
        await Airline.create({ ...air, agency: null });
      }
    }
    console.log('✅ Global airlines seeded.');

    // 8. Global Sectors
    const sectors = [
      { name: 'DAC - JED (DHAKA TO JEDDAH)', origin: 'DAC', destination: 'JED' },
      { name: 'DAC - MED (DHAKA TO MADINAH)', origin: 'DAC', destination: 'MED' },
      { name: 'DAC - DXB (DHAKA TO DUBAI)', origin: 'DAC', destination: 'DXB' },
      { name: 'DAC - RUH (DHAKA TO RIYADH)', origin: 'DAC', destination: 'RUH' },
      { name: 'DAC - DOH (DHAKA TO DOHA)', origin: 'DAC', destination: 'DOH' },
      { name: 'DAC - KUL (DHAKA TO KUALA LUMPUR)', origin: 'DAC', destination: 'KUL' },
      { name: 'DAC - SIN (DHAKA TO SINGAPORE)', origin: 'DAC', destination: 'SIN' },
      { name: 'DAC - LHR (DHAKA TO LONDON HEATHROW)', origin: 'DAC', destination: 'LHR' },
      { name: 'DAC - CXB (DHAKA TO COX\'S BAZAR)', origin: 'DAC', destination: 'CXB' }
    ];

    for (const sec of sectors) {
      const exists = await Sector.findOne({ name: sec.name, agency: null });
      if (!exists) {
        await Sector.create({ ...sec, agency: null });
      }
    }
    console.log('✅ Global sectors seeded.');

    console.log('\n🎉 Multi-tenant Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seed();
