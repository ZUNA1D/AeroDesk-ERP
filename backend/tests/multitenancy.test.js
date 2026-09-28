import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Agency } from '../src/models/Agency.js';
import { User } from '../src/models/User.js';
import { Client } from '../src/models/Client.js';
import { Supplier } from '../src/models/Supplier.js';
import { Transaction } from '../src/models/transaction/Transaction.js';
import {
  createTicketInvoice,
  createClientReceipt,
  recalculateAllBalances
} from '../src/services/transaction.service.js';

let replSet;
let agencyA;
let agencyB;
let userA;
let userB;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await replSet.waitUntilRunning();
  const uri = replSet.getUri();
  await mongoose.connect(uri);
  await Promise.all([
    Agency.init(),
    User.init(),
    Client.init(),
    Supplier.init(),
    Transaction.init()
  ]);

  // Agency A
  agencyA = await Agency.create({
    name: 'Sky High Travels',
    slug: 'sky-high',
    phone: '01711111111',
    email: 'admin@skyhigh.com'
  });

  userA = await User.create({
    name: 'Admin SkyHigh',
    email: 'admin@skyhigh.com',
    passwordHash: 'hashed123',
    role: 'ADMIN',
    agency: agencyA._id
  });

  // Agency B
  agencyB = await Agency.create({
    name: 'Oceanic Wings',
    slug: 'oceanic-wings',
    phone: '01722222222',
    email: 'admin@oceanic.com'
  });

  userB = await User.create({
    name: 'Admin Oceanic',
    email: 'admin@oceanic.com',
    passwordHash: 'hashed123',
    role: 'ADMIN',
    agency: agencyB._id
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
}, 30000);

beforeEach(async () => {
  await Client.deleteMany({});
  await Supplier.deleteMany({});
  await Transaction.deleteMany({});
});

describe('Multi-Tenancy Isolation & Robustness', () => {
  test('Each agency has completely independent sequence numbers starting from 000001', async () => {
    // Agency A setup
    const clientA = await Client.create({
      name: 'CLIENT AGENCY A',
      phone: '01700000001',
      agency: agencyA._id
    });
    const supplierA = await Supplier.create({
      name: 'PORTAL AGENCY A',
      type: 'PORTAL',
      balance: 100000,
      agency: agencyA._id
    });

    // Agency B setup
    const clientB = await Client.create({
      name: 'CLIENT AGENCY B',
      phone: '01700000002',
      agency: agencyB._id
    });
    const supplierB = await Supplier.create({
      name: 'PORTAL AGENCY B',
      type: 'PORTAL',
      balance: 100000,
      agency: agencyB._id
    });

    // 1. Create first invoice in Agency A
    const invoiceA1 = await createTicketInvoice({
      clientId: clientA._id,
      supplierId: supplierA._id,
      passengers: [{ name: 'PAX A1', cost: 10000, sell: 15000 }]
    }, userA._id, agencyA._id);

    // 2. Create first invoice in Agency B
    const invoiceB1 = await createTicketInvoice({
      clientId: clientB._id,
      supplierId: supplierB._id,
      passengers: [{ name: 'PAX B1', cost: 20000, sell: 25000 }]
    }, userB._id, agencyB._id);

    // Both should receive the exact same ref pattern starting at 000001 without collision!
    expect(invoiceA1.ref).toMatch(/-000001$/);
    expect(invoiceB1.ref).toMatch(/-000001$/);
    expect(invoiceA1.ref).toBe(invoiceB1.ref); // Identical sequence number, separated by agency

    // 3. Create second invoice in Agency A
    const invoiceA2 = await createTicketInvoice({
      clientId: clientA._id,
      supplierId: supplierA._id,
      passengers: [{ name: 'PAX A2', cost: 10000, sell: 15000 }]
    }, userA._id, agencyA._id);

    expect(invoiceA2.ref).toMatch(/-000002$/);

    // Verify both invoices exist in DB under different agencies
    const allInvoices = await Transaction.find({});
    expect(allInvoices).toHaveLength(3);

    const agencyAInvoices = await Transaction.find({ agency: agencyA._id });
    const agencyBInvoices = await Transaction.find({ agency: agencyB._id });
    expect(agencyAInvoices).toHaveLength(2);
    expect(agencyBInvoices).toHaveLength(1);
  });

  test('Agencies can have identically named Clients and Suppliers without conflicts', async () => {
    // Both agencies create a client named "KARIM UDDIN"
    const clientA = await Client.create({
      name: 'KARIM UDDIN',
      phone: '01811111111',
      agency: agencyA._id,
      currentDue: 5000
    });

    const clientB = await Client.create({
      name: 'KARIM UDDIN',
      phone: '01822222222',
      agency: agencyB._id,
      currentDue: 12000
    });

    expect(clientA.name).toBe(clientB.name);
    expect(clientA._id.toString()).not.toBe(clientB._id.toString());

    // Scoped query for Agency A
    const foundA = await Client.find({ agency: agencyA._id, name: 'KARIM UDDIN' });
    expect(foundA).toHaveLength(1);
    expect(foundA[0].phone).toBe('01811111111');
    expect(foundA[0].currentDue).toBe(5000);

    // Scoped query for Agency B
    const foundB = await Client.find({ agency: agencyB._id, name: 'KARIM UDDIN' });
    expect(foundB).toHaveLength(1);
    expect(foundB[0].phone).toBe('01822222222');
    expect(foundB[0].currentDue).toBe(12000);
  });

  test('Cross-tenant resource access is strictly prevented in service operations', async () => {
    const clientA = await Client.create({
      name: 'PRIVATE CLIENT A',
      agency: agencyA._id
    });
    const supplierA = await Supplier.create({
      name: 'PRIVATE SUPPLIER A',
      type: 'PORTAL',
      agency: agencyA._id
    });

    // Agency B attempts to create an invoice using Agency A's client
    await expect(
      createTicketInvoice({
        clientId: clientA._id, // BELONGS TO AGENCY A!
        supplierId: supplierA._id,
        passengers: [{ name: 'HACKER PAX', cost: 1000, sell: 2000 }]
      }, userB._id, agencyB._id)
    ).rejects.toThrow(); // Will not find clientA for agencyB
  });

  test('Recalculate All Balances in Agency A never affects Agency B', async () => {
    // Agency A: 1 invoice 40,000 sell
    const clientA = await Client.create({ name: 'CLIENT A', agency: agencyA._id });
    const supplierA = await Supplier.create({ name: 'SUPPLIER A', type: 'PORTAL', balance: 100000, agency: agencyA._id });
    await createTicketInvoice({
      clientId: clientA._id,
      supplierId: supplierA._id,
      passengers: [{ name: 'PAX A', cost: 30000, sell: 40000 }]
    }, userA._id, agencyA._id);

    // Agency B: 1 invoice 70,000 sell
    const clientB = await Client.create({ name: 'CLIENT B', agency: agencyB._id });
    const supplierB = await Supplier.create({ name: 'SUPPLIER B', type: 'PORTAL', balance: 200000, agency: agencyB._id });
    await createTicketInvoice({
      clientId: clientB._id,
      supplierId: supplierB._id,
      passengers: [{ name: 'PAX B', cost: 50000, sell: 70000 }]
    }, userB._id, agencyB._id);

    // Corrupt Agency A client due to 999999
    await Client.updateOne({ _id: clientA._id }, { $set: { currentDue: 999999 } });

    // Agency B client due currently is 70,000
    const beforeClientB = await Client.findById(clientB._id);
    expect(beforeClientB.currentDue).toBe(70000);

    // Recalculate Agency A only
    const res = await recalculateAllBalances(userA._id, agencyA._id);
    expect(res.success).toBe(true);

    // Agency A restored
    const afterClientA = await Client.findById(clientA._id);
    expect(afterClientA.currentDue).toBe(40000);

    // Agency B completely untouched
    const afterClientB = await Client.findById(clientB._id);
    expect(afterClientB.currentDue).toBe(70000);
  });
});
