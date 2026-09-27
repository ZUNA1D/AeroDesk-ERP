import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { Settings } from '../models/Settings.js';
import { Supplier } from '../models/Supplier.js';
import { User } from '../models/User.js';
import { Airline } from '../models/Airline.js';
import { Sector } from '../models/Sector.js';

async function seed() {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    // 1. Settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        companyName: 'AeroDesk',
        tagline: 'Travel & Aviation Agency Management ERP',
        address: 'Dhaka, Bangladesh',
        phone: '+880 1711-000000',
        email: 'admin@aerodesk.com',
        website: 'https://aerodesk.app',
        currency: 'BDT'
      });
      console.log('✅ Settings seeded: AeroDesk (Default)');
    } else {
      console.log('ℹ️ Settings already exist.');
    }

    // 2. Direct / In-House Supplier
    let directSupplier = await Supplier.findOne({ isSelf: true });
    if (!directSupplier) {
      directSupplier = await Supplier.create({
        name: 'IN-HOUSE / OWN STOCK',
        type: 'DIRECT',
        isSelf: true,
        contactPerson: 'Internal Inventory',
        phone: '+880 1700-000000',
        email: 'stock@aerodesk.com',
        balance: 0,
        active: true
      });
      console.log('✅ In-house DIRECT supplier created: IN-HOUSE / OWN STOCK');
    }

    // 3. Sample Suppliers (Portal & Agency)
    const portalSuppliers = [
      { name: 'SABRE / BSP WALLET', type: 'PORTAL', contactPerson: 'BSP Desk', phone: '+880 1711-000001', balance: 500000 },
      { name: 'AMADEUS B2B WALLET', type: 'PORTAL', contactPerson: 'Amadeus Support', phone: '+880 1711-000002', balance: 250000 },
      { name: 'FLYHUB B2B PORTAL', type: 'PORTAL', contactPerson: 'Flyhub Sales', phone: '+880 1711-000003', balance: 150000 }
    ];

    for (const sup of portalSuppliers) {
      const exists = await Supplier.findOne({ name: sup.name });
      if (!exists) {
        await Supplier.create(sup);
        console.log(`✅ Portal supplier created: ${sup.name}`);
      }
    }

    const agencySuppliers = [
      { name: 'DYNAMIC TRAVELS LTD', type: 'AGENCY', contactPerson: 'Mr. Rafiq', phone: '+880 1811-000001', creditLimit: 500000, balance: 120000 },
      { name: 'HORIZON AVIATION CONSOLIDATOR', type: 'AGENCY', contactPerson: 'Mr. Kamal', phone: '+880 1811-000002', creditLimit: 1000000, balance: 340000 }
    ];

    for (const sup of agencySuppliers) {
      const exists = await Supplier.findOne({ name: sup.name });
      if (!exists) {
        await Supplier.create(sup);
        console.log(`✅ Agency supplier created: ${sup.name}`);
      }
    }

    // 4. Airlines
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
      const exists = await Airline.findOne({ name: air.name });
      if (!exists) {
        await Airline.create(air);
      }
    }
    console.log('✅ Airlines seeded.');

    // 5. Sectors
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
      const exists = await Sector.findOne({ name: sec.name });
      if (!exists) {
        await Sector.create(sec);
      }
    }
    console.log('✅ Sectors seeded.');

    // 6. Admin User
    const adminEmail = 'admin@aerodesk.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);

      admin = await User.create({
        name: 'AeroDesk Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        active: true
      });
      console.log(`✅ Default admin created: ${adminEmail} (password: admin123)`);
    } else {
      console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
    }

    console.log('\n🎉 Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

seed();
