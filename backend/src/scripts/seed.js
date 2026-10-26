import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { Agency } from '../models/Agency.js';
import { Settings } from '../models/Settings.js';
import { Supplier } from '../models/Supplier.js';
import { User } from '../models/User.js';
import { Airline } from '../models/Airline.js';
import { Sector } from '../models/Sector.js';
import { Client } from '../models/Client.js';
import { Counter } from '../models/Counter.js';
import { AuditLog } from '../models/AuditLog.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { Transaction } from '../models/transaction/Transaction.js';
import { TicketInvoice } from '../models/transaction/TicketInvoice.js';
import { VisaInvoice } from '../models/transaction/VisaInvoice.js';
import { ClientReceipt } from '../models/transaction/ClientReceipt.js';
import { Expense } from '../models/transaction/Expense.js';
import { SupplierDeposit, SupplierPayment } from '../models/transaction/SupplierTxn.js';
import { getNextRef } from '../services/counter.service.js';
import { recalculateAllBalances } from '../services/transaction.service.js';

export async function seed() {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    // =========================================================================
    // 1. Platform Root Super Admin (Platform Owner Only)
    // =========================================================================
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
      console.log(`ℹ️ Platform Super Admin exists: ${superAdminEmail}`);
    }

    // =========================================================================
    // 2. Global Master Data: Airlines & Flight Sectors
    // =========================================================================
    const airlinesList = [
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

    for (const air of airlinesList) {
      await Airline.findOneAndUpdate(
        { name: air.name, agency: null },
        { ...air, agency: null },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Global airlines ensured.');

    const sectorsList = [
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

    for (const sec of sectorsList) {
      await Sector.findOneAndUpdate(
        { name: sec.name, agency: null },
        { ...sec, agency: null },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Global flight sectors ensured.');

    // Pre-fetch airlines and sectors map for fast reference
    const airlineMap = {};
    (await Airline.find({ agency: null })).forEach(a => { airlineMap[a.iataCode] = a._id; });
    const sectorMap = {};
    (await Sector.find({ agency: null })).forEach(s => { sectorMap[`${s.origin}-${s.destination}`] = s._id; });

    // =========================================================================
    // 3. Demo Agency Workspace: SKYLINE TRAVELS & TOURS
    // =========================================================================
    let agency = await Agency.findOne({ slug: 'skyline-travels' });
    if (!agency) {
      agency = await Agency.create({
        name: 'SKYLINE TRAVELS & TOURS',
        slug: 'skyline-travels',
        email: 'skyline@aerodesk.app',
        phone: '+880 1711-234567',
        address: 'Plot 14, Road 11, Block D, Banani / Gulshan-2, Dhaka 1213',
        subscriptionPlan: 'ENTERPRISE',
        maxUsers: 25,
        status: 'ACTIVE'
      });
      console.log(`✅ Demo Agency workspace created: ${agency.name} (${agency.slug})`);
    } else {
      agency.name = 'SKYLINE TRAVELS & TOURS';
      agency.address = 'Plot 14, Road 11, Block D, Banani / Gulshan-2, Dhaka 1213';
      agency.phone = '+880 1711-234567';
      agency.status = 'ACTIVE';
      await agency.save();
      console.log(`ℹ️ Demo Agency verified: ${agency.name}`);
    }

    // =========================================================================
    // 4. Demo Agency Staff Users (Admin, Manager, Ticketing Officer)
    // =========================================================================
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);
    const managerPasswordHash = await bcrypt.hash('manager123', salt);
    const staffPasswordHash = await bcrypt.hash('staff123', salt);

    // Agency Admin
    let admin = await User.findOne({ email: 'admin@aerodesk.com' });
    if (!admin) {
      admin = await User.create({
        agency: agency._id,
        name: 'Skyline Admin',
        email: 'admin@aerodesk.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        active: true
      });
    } else {
      admin.agency = agency._id;
      admin.name = 'Skyline Admin';
      admin.passwordHash = adminPasswordHash;
      admin.role = 'ADMIN';
      admin.active = true;
      await admin.save();
    }
    agency.owner = admin._id;
    await agency.save();

    // Operations Manager
    let manager = await User.findOne({ email: 'manager@aerodesk.com' });
    if (!manager) {
      manager = await User.create({
        agency: agency._id,
        name: 'Tanvir Ahmed (Operations Manager)',
        email: 'manager@aerodesk.com',
        passwordHash: managerPasswordHash,
        role: 'MANAGER',
        active: true
      });
    } else {
      manager.agency = agency._id;
      manager.name = 'Tanvir Ahmed (Operations Manager)';
      manager.passwordHash = managerPasswordHash;
      manager.role = 'MANAGER';
      manager.active = true;
      await manager.save();
    }

    // Ticketing Staff
    let staff = await User.findOne({ email: 'staff@aerodesk.com' });
    if (!staff) {
      staff = await User.create({
        agency: agency._id,
        name: 'Sabrina Yasmin (Ticketing Officer)',
        email: 'staff@aerodesk.com',
        passwordHash: staffPasswordHash,
        role: 'STAFF',
        active: true
      });
    } else {
      staff.agency = agency._id;
      staff.name = 'Sabrina Yasmin (Ticketing Officer)';
      staff.passwordHash = staffPasswordHash;
      staff.role = 'STAFF';
      staff.active = true;
      await staff.save();
    }
    console.log('✅ Demo users verified (admin@aerodesk.com, manager@aerodesk.com, staff@aerodesk.com)');

    // =========================================================================
    // 5. Agency Settings
    // =========================================================================
    await Settings.findOneAndUpdate(
      { agency: agency._id },
      {
        agency: agency._id,
        companyName: 'Skyline Travels & Tours',
        tagline: 'Premier IATA Accredited Travel & Aviation ERP',
        address: 'Plot 14, Road 11, Block D, Banani / Gulshan-2, Dhaka 1213',
        phone: '+880 1711-234567',
        email: 'info@skylinetravels.com',
        website: 'https://aero-desk-erp.vercel.app',
        currency: 'BDT'
      },
      { upsert: true, new: true }
    );
    console.log('✅ Agency settings configured.');

    // =========================================================================
    // 6. PURGE PREVIOUS DEMO DATA (Clean Slate for Demo Agency)
    // =========================================================================
    console.log('🧹 Purging old demo transactions, clients, suppliers & counters for skyline-travels...');
    await Transaction.deleteMany({ agency: agency._id });
    await Client.deleteMany({ agency: agency._id });
    await Supplier.deleteMany({ agency: agency._id });
    await Counter.deleteMany({ _id: { $regex: `^${agency._id}:` } });
    await AuditLog.deleteMany({ agency: agency._id });
    await ExpenseCategory.deleteMany({ agency: agency._id });

    // =========================================================================
    // 7. Seed Expense Categories
    // =========================================================================
    const expenseCategoryDocs = await ExpenseCategory.insertMany([
      { agency: agency._id, name: 'Office Rent' },
      { agency: agency._id, name: 'Utilities (Electricity / Water / Internet)' },
      { agency: agency._id, name: 'Staff Salaries & Allowances' },
      { agency: agency._id, name: 'GDS Software & Subscriptions' },
      { agency: agency._id, name: 'Office Supplies & Stationery' },
      { agency: agency._id, name: 'Entertainment & Hospitality' },
      { agency: agency._id, name: 'Bank & Merchant Charges' },
      { agency: agency._id, name: 'Miscellaneous' }
    ]);
    const categoryMap = {};
    expenseCategoryDocs.forEach(c => { categoryMap[c.name] = c._id; });
    console.log('✅ Expense categories seeded.');

    // =========================================================================
    // 8. Seed Suppliers (Portals, Consolidators, Direct)
    // =========================================================================
    const inHouseSupplier = await Supplier.create({
      agency: agency._id,
      name: 'IN-HOUSE / OWN STOCK',
      type: 'DIRECT',
      isSelf: true,
      contactPerson: 'Internal Inventory Desk',
      phone: '+880 1700-000000',
      email: 'stock@skylinetravels.com',
      balance: 0,
      active: true
    });

    const sabreSupplier = await Supplier.create({
      agency: agency._id,
      name: 'SABRE GDS PORTAL WALLET',
      type: 'PORTAL',
      contactPerson: 'Sabre Travel Network Desk',
      phone: '+880 1713-100200',
      email: 'bsp.desk@sabre.com',
      balance: 0,
      active: true
    });

    const amadeusSupplier = await Supplier.create({
      agency: agency._id,
      name: 'AMADEUS B2B WALLET',
      type: 'PORTAL',
      contactPerson: 'Amadeus Bangladesh Support',
      phone: '+880 1713-200300',
      email: 'helpdesk@amadeus.com',
      balance: 0,
      active: true
    });

    const flyhubSupplier = await Supplier.create({
      agency: agency._id,
      name: 'FLYHUB B2B CONSOLIDATOR',
      type: 'PORTAL',
      contactPerson: 'Flyhub API Ticketing Desk',
      phone: '+880 1713-300400',
      email: 'support@flyhub.com',
      balance: 0,
      active: true
    });

    const dynamicSupplier = await Supplier.create({
      agency: agency._id,
      name: 'DYNAMIC TRAVELS LTD',
      type: 'AGENCY',
      contactPerson: 'Mr. Rafiqul Islam (Accounts)',
      phone: '+880 1819-445566',
      email: 'accounts@dynamictravels.com',
      creditLimit: 1000000,
      balance: 0,
      active: true
    });

    const horizonSupplier = await Supplier.create({
      agency: agency._id,
      name: 'HORIZON AVIATION CONSOLIDATOR',
      type: 'AGENCY',
      contactPerson: 'Mr. Kamal Uddin (Managing Partner)',
      phone: '+880 1819-778899',
      email: 'partner@horizonaviation.com',
      creditLimit: 1500000,
      balance: 0,
      active: true
    });
    console.log('✅ Suppliers seeded (Direct, 3 Portal Wallets, 2 Consolidators).');

    // =========================================================================
    // 9. Seed Realistic Clients
    // =========================================================================
    const now = new Date();
    // Expiries set relative to current date
    const expirySoon1 = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000); // in ~42 days (Triggers Expiring Passports warning widget!)
    const expirySoon2 = new Date(now.getTime() + 68 * 24 * 60 * 60 * 1000); // in ~68 days (Triggers Expiring Passports warning widget!)
    const expiryFar = new Date(now.getTime() + 650 * 24 * 60 * 60 * 1000); // in ~1.8 years

    const clientApex = await Client.create({
      agency: agency._id,
      name: 'APEX FOOTWEAR LTD (CORPORATE)',
      phone: '+880 1712-334455',
      email: 'travel.desk@apexfootwear.com',
      address: 'Tejgaon Industrial Area, Dhaka',
      notes: 'Corporate account - Long-haul executive travel',
      currentDue: 0,
      createdBy: admin._id
    });

    const clientBeximco = await Client.create({
      agency: agency._id,
      name: 'BEXIMCO PHARMACEUTICALS',
      phone: '+880 1711-889900',
      email: 'corporate@beximco.net',
      address: '17 Dhanmondi R/A, Road 2, Dhaka',
      notes: 'Overseas medical delegates travel desk',
      currentDue: 0,
      createdBy: admin._id
    });

    const clientTariqul = await Client.create({
      agency: agency._id,
      name: 'DR. TARIQUL ISLAM',
      phone: '+880 1819-223344',
      email: 'dr.tariqul@gmail.com',
      address: 'House 42, Road 7, Dhanmondi, Dhaka',
      passportNo: 'A08472911',
      passportExpiry: expirySoon1,
      notes: 'Senior Consultant Surgeon - Frequent UK & Singapore flyer',
      currentDue: 0,
      createdBy: admin._id
    });

    const clientRashed = await Client.create({
      agency: agency._id,
      name: 'MOHAMMAD RASHED KHAN',
      phone: '+880 1911-556677',
      email: 'mkhan.biz@yahoo.com',
      address: 'Sector 4, Uttara, Dhaka',
      passportNo: 'B01928374',
      passportExpiry: expirySoon2,
      notes: 'Managing Director, Trade & Commerce - Frequent Umrah & Dubai traveler',
      currentDue: 0,
      createdBy: admin._id
    });

    const clientNusrat = await Client.create({
      agency: agency._id,
      name: 'NUSRAT JAHAN CHOWDHURY',
      phone: '+880 1612-998877',
      email: 'nusrat.chowdhury@outlook.com',
      address: 'Nasirabad Housing Society, Chittagong',
      passportNo: 'A11223344',
      passportExpiry: expiryFar,
      notes: 'Domestic & regional leisure travel',
      currentDue: 0,
      createdBy: admin._id
    });

    const clientAlNoor = await Client.create({
      agency: agency._id,
      name: 'AL-NOOR HAJJ & UMRAH SERVICES',
      phone: '+880 1720-445566',
      email: 'info@alnoor-travel.com',
      address: 'Kakrail Mosque Road, Dhaka',
      notes: 'Partner agency for Umrah visas & group flight packages',
      currentDue: 0,
      createdBy: admin._id
    });
    console.log('✅ Realistic Clients created with passport expiry dates.');

    // =========================================================================
    // 10. Seed Realistic Transactions (Chronological Ledger)
    // =========================================================================
    console.log('📝 Seeding rich transactions across ticketing, visas, receipts, deposits & expenses...');

    // Helper date generator relative to today (0 = today, -1 = yesterday, etc.)
    const makeDate = (daysAgo, hours = 10, minutes = 30) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    // --- STEP 10.1: Initial Portal Wallet Top-ups (7 days ago) ---
    // Sabre Deposit
    const dep1Ref = await getNextRef('DEP', null, agency._id);
    await SupplierDeposit.create({
      agency: agency._id,
      ref: dep1Ref,
      date: makeDate(7, 9, 15),
      status: 'ACTIVE',
      supplier: sabreSupplier._id,
      createdBy: admin._id,
      amount: 600000,
      subtype: 'DEPOSIT',
      mode: 'BANK',
      bspRef: 'BSP-DHAKA-TOPUP-9941',
      remarks: 'Premier Bank RTGS Transfer to Sabre BSP Portal Wallet',
      notes: 'Initial operational top-up'
    });

    // Amadeus Deposit
    const dep2Ref = await getNextRef('DEP', null, agency._id);
    await SupplierDeposit.create({
      agency: agency._id,
      ref: dep2Ref,
      date: makeDate(7, 9, 45),
      status: 'ACTIVE',
      supplier: amadeusSupplier._id,
      createdBy: admin._id,
      amount: 350000,
      subtype: 'DEPOSIT',
      mode: 'BANK',
      bspRef: 'AMD-B2B-TXN-4412',
      remarks: 'City Bank Corporate Transfer to Amadeus Portal',
      notes: 'B2B wallet balance replenishment'
    });

    // Flyhub Deposit
    const dep3Ref = await getNextRef('DEP', null, agency._id);
    await SupplierDeposit.create({
      agency: agency._id,
      ref: dep3Ref,
      date: makeDate(7, 10, 0),
      status: 'ACTIVE',
      supplier: flyhubSupplier._id,
      createdBy: admin._id,
      amount: 200000,
      subtype: 'DEPOSIT',
      mode: 'ONLINE',
      bspRef: 'FLY-API-WLT-1109',
      remarks: 'Online Gateway Instant Top-up for Flyhub API Wallet',
      notes: 'Consolidator prepaid wallet'
    });

    // --- STEP 10.2: Corporate Long-Haul Ticket Invoice (6 days ago) ---
    const inv1Ref = await getNextRef('INVT', null, agency._id);
    await TicketInvoice.create({
      agency: agency._id,
      ref: inv1Ref,
      date: makeDate(6, 11, 20),
      status: 'ACTIVE',
      client: clientApex._id,
      supplier: sabreSupplier._id,
      createdBy: admin._id,
      passengers: [
        {
          name: 'MR. SYED MANZUR ELAHI',
          ticketNo: '176-4920192831',
          pnr: 'EK889B',
          airline: airlineMap['EK'],
          route: 'DAC - LHR (DHAKA TO LONDON HEATHROW)',
          cost: 125000,
          sell: 142000,
          profit: 17000
        },
        {
          name: 'MS. SHAHNAZ RAHMAN',
          ticketNo: '176-4920192832',
          pnr: 'EK889B',
          airline: airlineMap['EK'],
          route: 'DAC - LHR (DHAKA TO LONDON HEATHROW)',
          cost: 125000,
          sell: 142000,
          profit: 17000
        }
      ],
      totalBuy: 250000,
      totalSell: 284000,
      profit: 34000,
      notes: 'Emirates Business Class tickets - Apex Annual Trade Summit London'
    });

    // Client Receipt for Apex (Advance payment) (6 days ago)
    const crv1Ref = await getNextRef('CRV', null, agency._id);
    await ClientReceipt.create({
      agency: agency._id,
      ref: crv1Ref,
      date: makeDate(6, 14, 0),
      status: 'ACTIVE',
      client: clientApex._id,
      createdBy: staff._id,
      amount: 200000,
      mode: 'BANK',
      bankName: 'Standard Chartered Bank',
      chequeNo: 'SCB-CORP-449102',
      remarks: 'Cheque received for London business tickets (Apex Footwear)',
      notes: 'Remaining due 84,000 BDT to be cleared on corporate credit cycle'
    });

    // --- STEP 10.3: Umrah Group Visa Invoice (5 days ago) ---
    const visa1Ref = await getNextRef('VISA', null, agency._id);
    await VisaInvoice.create({
      agency: agency._id,
      ref: visa1Ref,
      date: makeDate(5, 10, 15),
      status: 'ACTIVE',
      client: clientAlNoor._id,
      supplier: dynamicSupplier._id, // Consolidator credit line
      createdBy: manager._id,
      passengers: [
        {
          name: 'ABDUR RAHIM',
          visaNo: 'E-SA-994812',
          sector: sectorMap['DAC-JED'],
          cost: 14500,
          sell: 17500,
          profit: 3000
        },
        {
          name: 'FATEMA BEGUM',
          visaNo: 'E-SA-994813',
          sector: sectorMap['DAC-JED'],
          cost: 14500,
          sell: 17500,
          profit: 3000
        },
        {
          name: 'MD. ABDUL KARIM',
          visaNo: 'E-SA-994814',
          sector: sectorMap['DAC-JED'],
          cost: 14500,
          sell: 17500,
          profit: 3000
        }
      ],
      totalBuy: 43500,
      totalSell: 52500,
      profit: 9000,
      notes: 'Group Umrah E-Visa issuance through Dynamic Travels Consolidator'
    });

    // Client Receipt from Al-Noor (Full Settlement) (5 days ago)
    const crv2Ref = await getNextRef('CRV', null, agency._id);
    await ClientReceipt.create({
      agency: agency._id,
      ref: crv2Ref,
      date: makeDate(5, 12, 30),
      status: 'ACTIVE',
      client: clientAlNoor._id,
      createdBy: staff._id,
      amount: 52500,
      mode: 'CASH',
      remarks: 'Full cash settlement for 3 Umrah E-Visas (Al-Noor Hajj & Umrah)',
      notes: 'Payment collected at front desk'
    });

    // --- STEP 10.4: Medical Consultant Ticket Invoice (4 days ago) ---
    const inv2Ref = await getNextRef('INVT', null, agency._id);
    await TicketInvoice.create({
      agency: agency._id,
      ref: inv2Ref,
      date: makeDate(4, 11, 45),
      status: 'ACTIVE',
      client: clientTariqul._id,
      supplier: amadeusSupplier._id,
      createdBy: staff._id,
      passengers: [
        {
          name: 'DR. TARIQUL ISLAM',
          ticketNo: '098-7711223344',
          pnr: 'BG44PQ',
          airline: airlineMap['BG'],
          route: 'DAC - SIN (DHAKA TO SINGAPORE)',
          cost: 42000,
          sell: 49000,
          profit: 7000
        }
      ],
      totalBuy: 42000,
      totalSell: 49000,
      profit: 7000,
      notes: 'Biman Bangladesh Airlines round-trip to Singapore for medical seminar'
    });

    // Client Receipt from Dr. Tariqul (Full Settlement via Card) (4 days ago)
    const crv3Ref = await getNextRef('CRV', null, agency._id);
    await ClientReceipt.create({
      agency: agency._id,
      ref: crv3Ref,
      date: makeDate(4, 12, 10),
      status: 'ACTIVE',
      client: clientTariqul._id,
      createdBy: staff._id,
      amount: 49000,
      mode: 'CARD',
      bankName: 'Eastern Bank PLC (EBL)',
      transactionId: 'POS-AUTH-882910',
      remarks: 'Visa Signature card payment at office terminal',
      notes: 'Invoice settled in full'
    });

    // Office Rent Expense (4 days ago)
    const exp1Ref = await getNextRef('EXP', null, agency._id);
    await Expense.create({
      agency: agency._id,
      ref: exp1Ref,
      date: makeDate(4, 15, 0),
      status: 'ACTIVE',
      category: categoryMap['Office Rent'],
      createdBy: admin._id,
      amount: 55000,
      paidFrom: 'BANK',
      remarks: 'Monthly Banani office commercial lease rent payment',
      notes: 'Payment made via bank transfer'
    });

    // --- STEP 10.5: Corporate Delegates Ticket to Dubai (3 days ago) ---
    const inv3Ref = await getNextRef('INVT', null, agency._id);
    await TicketInvoice.create({
      agency: agency._id,
      ref: inv3Ref,
      date: makeDate(3, 10, 0),
      status: 'ACTIVE',
      client: clientBeximco._id,
      supplier: flyhubSupplier._id,
      createdBy: manager._id,
      passengers: [
        {
          name: 'MR. NAZMUL HASSAN',
          ticketNo: '141-8833991100',
          pnr: 'FZ55TY',
          airline: airlineMap['FZ'],
          route: 'DAC - DXB (DHAKA TO DUBAI)',
          cost: 38000,
          sell: 44000,
          profit: 6000
        },
        {
          name: 'MR. REZAUL KARIM',
          ticketNo: '141-8833991101',
          pnr: 'FZ55TY',
          airline: airlineMap['FZ'],
          route: 'DAC - DXB (DHAKA TO DUBAI)',
          cost: 38000,
          sell: 44000,
          profit: 6000
        }
      ],
      totalBuy: 76000,
      totalSell: 88000,
      profit: 12000,
      notes: 'Flydubai tickets for Beximco Pharma delegates - Dubai Pharma Expo'
    });

    // Supplier Payment to Consolidator (Pay down Dynamic Travels payable debt) (3 days ago)
    const pay1Ref = await getNextRef('PAY', null, agency._id);
    await SupplierPayment.create({
      agency: agency._id,
      ref: pay1Ref,
      date: makeDate(3, 16, 20),
      status: 'ACTIVE',
      supplier: dynamicSupplier._id,
      createdBy: admin._id,
      amount: 25000,
      subtype: 'PAYMENT',
      mode: 'BANK',
      bspRef: 'BEFTN-OUT-77120',
      remarks: 'Part payment against Umrah visas payable balance to Dynamic Travels',
      notes: 'Consolidator ledger settlement'
    });

    // --- STEP 10.6: Domestic Family Holiday (2 days ago) ---
    const inv4Ref = await getNextRef('INVT', null, agency._id);
    await TicketInvoice.create({
      agency: agency._id,
      ref: inv4Ref,
      date: makeDate(2, 11, 10),
      status: 'ACTIVE',
      client: clientNusrat._id,
      supplier: inHouseSupplier._id, // Direct stock
      createdBy: staff._id,
      passengers: [
        {
          name: 'NUSRAT JAHAN CHOWDHURY',
          ticketNo: '770-1122334455',
          pnr: 'BS11AA',
          airline: airlineMap['BS'],
          route: 'DAC - CXB (DHAKA TO COX\'S BAZAR)',
          cost: 7500,
          sell: 9200,
          profit: 1700
        },
        {
          name: 'KAMRAN CHOWDHURY',
          ticketNo: '770-1122334456',
          pnr: 'BS11AA',
          airline: airlineMap['BS'],
          route: 'DAC - CXB (DHAKA TO COX\'S BAZAR)',
          cost: 7500,
          sell: 9200,
          profit: 1700
        }
      ],
      totalBuy: 15000,
      totalSell: 18400,
      profit: 3400,
      notes: 'US-Bangla Airlines holiday tickets to Cox\'s Bazar from in-house stock'
    });

    // Client Receipt from Nusrat (bKash Mobile Payment) (2 days ago)
    const crv4Ref = await getNextRef('CRV', null, agency._id);
    await ClientReceipt.create({
      agency: agency._id,
      ref: crv4Ref,
      date: makeDate(2, 11, 25),
      status: 'ACTIVE',
      client: clientNusrat._id,
      createdBy: staff._id,
      amount: 18400,
      mode: 'MOBILE',
      transactionId: 'BKASH-TRX-9K2L1M',
      remarks: 'Full payment via bKash Merchant (Nusrat Jahan)',
      notes: 'Payment confirmed in merchant statement'
    });

    // Voided Ticket Invoice Example (Demonstrates Void & Audit Trail Feature!) (2 days ago)
    const invVoidRef = await getNextRef('INVT', null, agency._id);
    await TicketInvoice.create({
      agency: agency._id,
      ref: invVoidRef,
      date: makeDate(2, 14, 30),
      status: 'VOIDED',
      voidReason: 'Passenger requested immediate cancellation before ticket issuance; ledger reversed safely with zero debt penalty.',
      voidedBy: admin._id,
      voidedAt: makeDate(2, 15, 0),
      client: clientRashed._id,
      supplier: sabreSupplier._id,
      createdBy: staff._id,
      passengers: [
        {
          name: 'MOHAMMAD RASHED KHAN',
          ticketNo: '098-9900112233',
          pnr: 'VOID77',
          airline: airlineMap['BG'],
          route: 'DAC - DXB (DHAKA TO DUBAI)',
          cost: 45000,
          sell: 52000,
          profit: 7000
        }
      ],
      totalBuy: 45000,
      totalSell: 52000,
      profit: 7000,
      notes: 'Cancelled booking demonstration'
    });

    // Office Internet & Utilities Expense (1 day ago)
    const exp2Ref = await getNextRef('EXP', null, agency._id);
    await Expense.create({
      agency: agency._id,
      ref: exp2Ref,
      date: makeDate(1, 16, 0),
      status: 'ACTIVE',
      category: categoryMap['Utilities (Electricity / Water / Internet)'],
      createdBy: admin._id,
      amount: 8500,
      paidFrom: 'CASH',
      remarks: 'Dedicated optical fiber internet line & office utility expenses',
      notes: 'Petty cash voucher #89'
    });

    // --- STEP 10.7: TODAY'S TRANSACTIONS (Shows up on "Today's Sales" & "Today's Profit"!) ---
    // Flight to Jeddah Issued Today
    const invTodayRef = await getNextRef('INVT', null, agency._id);
    await TicketInvoice.create({
      agency: agency._id,
      ref: invTodayRef,
      date: makeDate(0, 9, 30),
      status: 'ACTIVE',
      client: clientRashed._id,
      supplier: sabreSupplier._id,
      createdBy: manager._id,
      passengers: [
        {
          name: 'MOHAMMAD RASHED KHAN',
          ticketNo: '065-9988112233',
          pnr: 'SV92WK',
          airline: airlineMap['SV'],
          route: 'DAC - JED (DHAKA TO JEDDAH)',
          cost: 62000,
          sell: 72500,
          profit: 10500
        }
      ],
      totalBuy: 62000,
      totalSell: 72500,
      profit: 10500,
      notes: 'Saudia Airlines direct flight to Jeddah - Umrah travel'
    });

    // Dubai Visa Issued Today
    const visaTodayRef = await getNextRef('VISA', null, agency._id);
    await VisaInvoice.create({
      agency: agency._id,
      ref: visaTodayRef,
      date: makeDate(0, 10, 15),
      status: 'ACTIVE',
      client: clientRashed._id,
      supplier: horizonSupplier._id, // Consolidator credit line
      createdBy: staff._id,
      passengers: [
        {
          name: 'MOHAMMAD RASHED KHAN',
          visaNo: 'DXB-2026-88192',
          sector: sectorMap['DAC-DXB'],
          cost: 12000,
          sell: 15500,
          profit: 3500
        }
      ],
      totalBuy: 12000,
      totalSell: 15500,
      profit: 3500,
      notes: '30-Day UAE Tourist E-Visa via Horizon Aviation'
    });

    // Partial Cash Payment Collected Today
    const crvTodayRef = await getNextRef('CRV', null, agency._id);
    await ClientReceipt.create({
      agency: agency._id,
      ref: crvTodayRef,
      date: makeDate(0, 11, 45),
      status: 'ACTIVE',
      client: clientRashed._id,
      createdBy: staff._id,
      amount: 30000,
      mode: 'CASH',
      remarks: 'Partial cash payment for Jeddah ticket and Dubai visa',
      notes: 'Balance due 58,000 BDT payable upon departure'
    });

    // =========================================================================
    // 11. Run Self-Healing Balance Recalculation (Synchronize All Ledgers)
    // =========================================================================
    console.log('🔄 Running balance reconciliation across clients and suppliers...');
    const recalcResult = await recalculateAllBalances(admin._id, agency._id);
    console.log(`✅ Balance reconciliation complete: ${recalcResult.processedTransactions} transactions verified.`);

    // =========================================================================
    // 12. Print Summary for Demonstration
    // =========================================================================
    const finalClients = await Client.find({ agency: agency._id });
    const finalSuppliers = await Supplier.find({ agency: agency._id });
    const totalDue = finalClients.reduce((acc, c) => acc + (c.currentDue || 0), 0);
    const totalPortals = finalSuppliers.filter(s => s.type === 'PORTAL').reduce((acc, s) => acc + (s.balance || 0), 0);
    const totalAgencyDue = finalSuppliers.filter(s => s.type === 'AGENCY').reduce((acc, s) => acc + (s.balance || 0), 0);

    console.log('\n======================================================');
    console.log('🎉 DEMO DATA RE-INITIALIZATION COMPLETED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`🏢 Workspace: ${agency.name} (${agency.slug})`);
    console.log(`👤 Demo Admin: admin@aerodesk.com (password: admin123)`);
    console.log(`👥 Total Clients: ${finalClients.length}`);
    console.log(`🏦 Total Suppliers: ${finalSuppliers.length}`);
    console.log(`💰 Client Outstanding Receivables: ৳${totalDue.toLocaleString()}`);
    console.log(`💳 Portal Wallet Balances: ৳${totalPortals.toLocaleString()}`);
    console.log(`🧾 Consolidator Payables: ৳${totalAgencyDue.toLocaleString()}`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Error during seeding:', err);
    throw err;
  } finally {
    await disconnectDB();
  }
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
