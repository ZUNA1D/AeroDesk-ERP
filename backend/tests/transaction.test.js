import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { User } from '../src/models/User.js';
import { Client } from '../src/models/Client.js';
import { Supplier } from '../src/models/Supplier.js';
import { Transaction } from '../src/models/transaction/Transaction.js';
import {
  createTicketInvoice,
  createClientReceipt,
  createSupplierTxn,
  editTransaction,
  voidTransaction,
  recalculateAllBalances
} from '../src/services/transaction.service.js';

let replSet;
let testUser;
let testClient;
let portalSupplier;
let agencySupplier;
let directSupplier;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await replSet.waitUntilRunning();
  const uri = replSet.getUri();
  await mongoose.connect(uri);

  testUser = await User.create({
    name: 'Tester Admin',
    email: 'tester@test.com',
    passwordHash: 'hashed123',
    role: 'ADMIN'
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

  testClient = await Client.create({
    name: 'TEST TRAVELER',
    phone: '01700000000',
    currentDue: 0
  });

  portalSupplier = await Supplier.create({
    name: 'TEST PORTAL WALLET',
    type: 'PORTAL',
    balance: 100000 // 1 Lakh initial wallet balance
  });

  agencySupplier = await Supplier.create({
    name: 'TEST AGENCY CONSOLIDATOR',
    type: 'AGENCY',
    balance: 0 // 0 initial payable
  });

  directSupplier = await Supplier.create({
    name: 'IN-HOUSE / OWN STOCK',
    type: 'DIRECT',
    isSelf: true,
    balance: 0
  });
});

describe('Double-Entry Balance Updates & Accounting Integrity', () => {
  test('Ticket invoice increases Client Due and draws down Portal Wallet', async () => {
    const invoice = await createTicketInvoice({
      clientId: testClient._id,
      supplierId: portalSupplier._id,
      passengers: [
        { name: 'JOHN DOE', cost: 40000, sell: 50000, ticketNo: '0981234567' }
      ]
    }, testUser._id);

    expect(invoice.ref).toMatch(/^INVT-/);
    expect(invoice.totalBuy).toBe(40000);
    expect(invoice.totalSell).toBe(50000);
    expect(invoice.profit).toBe(10000);

    const updatedClient = await Client.findById(testClient._id);
    const updatedSupplier = await Supplier.findById(portalSupplier._id);

    // Client due should be 50,000
    expect(updatedClient.currentDue).toBe(50000);
    // Portal balance should be 100,000 - 40,000 = 60,000
    expect(updatedSupplier.balance).toBe(60000);
  });

  test('Ticket invoice with Agency supplier increases Client Due and increases Agency Payable', async () => {
    await createTicketInvoice({
      clientId: testClient._id,
      supplierId: agencySupplier._id,
      passengers: [
        { name: 'JANE DOE', cost: 35000, sell: 42000, ticketNo: '0987654321' }
      ]
    }, testUser._id);

    const updatedClient = await Client.findById(testClient._id);
    const updatedSupplier = await Supplier.findById(agencySupplier._id);

    expect(updatedClient.currentDue).toBe(42000);
    // Agency payable increases by cost
    expect(updatedSupplier.balance).toBe(35000);
  });

  test('Direct / In-House stock supplier balance never changes', async () => {
    await createTicketInvoice({
      clientId: testClient._id,
      supplierId: directSupplier._id,
      passengers: [
        { name: 'ALICE IN-HOUSE', cost: 20000, sell: 30000 }
      ]
    }, testUser._id);

    const updatedDirect = await Supplier.findById(directSupplier._id);
    expect(updatedDirect.balance).toBe(0);
  });

  test('Client Receipt reduces Client Due', async () => {
    // Initial sell 50,000
    await createTicketInvoice({
      clientId: testClient._id,
      supplierId: portalSupplier._id,
      passengers: [{ name: 'JOHN', cost: 40000, sell: 50000 }]
    }, testUser._id);

    // Receive 30,000 payment
    const receipt = await createClientReceipt({
      clientId: testClient._id,
      amount: 30000,
      mode: 'BANK'
    }, testUser._id);

    expect(receipt.ref).toMatch(/^CRV-/);

    const updatedClient = await Client.findById(testClient._id);
    // 50,000 - 30,000 = 20,000
    expect(updatedClient.currentDue).toBe(20000);
  });

  test('Supplier Deposit tops up Portal Wallet', async () => {
    await createSupplierTxn({
      supplierId: portalSupplier._id,
      amount: 50000,
      type: 'SUPPLIER_DEPOSIT'
    }, testUser._id);

    const updatedSupplier = await Supplier.findById(portalSupplier._id);
    // 100,000 + 50,000 = 150,000
    expect(updatedSupplier.balance).toBe(150000);
  });

  test('Edit transaction reverses old effect and applies new effect atomically', async () => {
    // Create initial invoice with Portal supplier
    const invoice = await createTicketInvoice({
      clientId: testClient._id,
      supplierId: portalSupplier._id,
      passengers: [{ name: 'TEST PAX', cost: 40000, sell: 50000 }]
    }, testUser._id);

    // Edit invoice: change cost to 45000, sell to 60000 and switch supplier to Agency
    await editTransaction(invoice._id, {
      clientId: testClient._id,
      supplierId: agencySupplier._id,
      passengers: [{ name: 'TEST PAX MODIFIED', cost: 45000, sell: 60000 }]
    }, testUser._id);

    const updatedClient = await Client.findById(testClient._id);
    const updatedPortal = await Supplier.findById(portalSupplier._id);
    const updatedAgency = await Supplier.findById(agencySupplier._id);

    // Client due should reflect new sell amount (60,000)
    expect(updatedClient.currentDue).toBe(60000);
    // Portal supplier should be fully reversed back to starting balance (100,000)
    expect(updatedPortal.balance).toBe(100000);
    // Agency supplier should receive new cost (45,000)
    expect(updatedAgency.balance).toBe(45000);
  });

  test('Voiding a transaction completely reverts all balances', async () => {
    const invoice = await createTicketInvoice({
      clientId: testClient._id,
      supplierId: portalSupplier._id,
      passengers: [{ name: 'VOIDING PAX', cost: 40000, sell: 50000 }]
    }, testUser._id);

    // Verify balances modified
    let client = await Client.findById(testClient._id);
    let supplier = await Supplier.findById(portalSupplier._id);
    expect(client.currentDue).toBe(50000);
    expect(supplier.balance).toBe(60000);

    // Void the transaction
    const voided = await voidTransaction(invoice._id, 'Customer cancelled flight', testUser._id);
    expect(voided.status).toBe('VOIDED');
    expect(voided.voidReason).toBe('Customer cancelled flight');

    client = await Client.findById(testClient._id);
    supplier = await Supplier.findById(portalSupplier._id);

    // Balances returned exactly to original starting state
    expect(client.currentDue).toBe(0);
    expect(supplier.balance).toBe(100000);
  });

  test('Recalculate All Balances reconstructs ground truth from history', async () => {
    // 1. Create a series of transactions
    await createTicketInvoice({
      clientId: testClient._id,
      supplierId: portalSupplier._id,
      passengers: [{ name: 'PAX 1', cost: 30000, sell: 40000 }]
    }, testUser._id);

    await createClientReceipt({
      clientId: testClient._id,
      amount: 15000
    }, testUser._id);

    // Manually corrupt the cached balances in the database to simulate drift
    await Client.updateOne({ _id: testClient._id }, { $set: { currentDue: 999999 } });
    await Supplier.updateOne({ _id: portalSupplier._id }, { $set: { balance: 999999 } });

    // Run the safety net recalculation
    const result = await recalculateAllBalances(testUser._id);
    expect(result.success).toBe(true);

    const client = await Client.findById(testClient._id);
    const supplier = await Supplier.findById(portalSupplier._id);

    // Client due should be 40000 - 15000 = 25000
    expect(client.currentDue).toBe(25000);
    // Portal balance should be 0 (starting baseline in recalculation) - 30000 = -30000
    expect(supplier.balance).toBe(-30000);
  });
});
