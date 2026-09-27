import { Transaction } from '../models/transaction/Transaction.js';
import { Client } from '../models/Client.js';
import { Supplier } from '../models/Supplier.js';
import { Settings } from '../models/Settings.js';
import mongoose from 'mongoose';

/**
 * 1. Client Statement
 */
export async function getClientStatement({ clientId, from, to }) {
  const client = await Client.findById(clientId);
  if (!client) {
    throw new Error('Client not found.');
  }

  const fromDate = from ? new Date(from) : new Date(0);
  const toDate = to ? new Date(to) : new Date(8640000000000000);
  // Ensure toDate includes end of day
  if (to) {
    toDate.setHours(23, 59, 59, 999);
  }

  // 1. Calculate Opening Balance (all ACTIVE txs before fromDate)
  let openingDue = 0;
  if (from) {
    const priorTxs = await Transaction.find({
      client: client._id,
      status: 'ACTIVE',
      date: { $lt: fromDate }
    });

    for (const tx of priorTxs) {
      if (tx.type === 'TICKET_INVOICE' || tx.type === 'VISA_INVOICE') {
        openingDue += Number(tx.totalSell) || 0;
      } else if (tx.type === 'CLIENT_RECEIPT') {
        openingDue -= Number(tx.amount) || 0;
      } else if (tx.type === 'REFUND') {
        openingDue -= Number(tx.clientRefundAmount || tx.amount) || 0;
      }
    }
  }

  // 2. Fetch Period Transactions
  const periodTxs = await Transaction.find({
    client: client._id,
    status: 'ACTIVE',
    date: { $gte: fromDate, $lte: toDate }
  })
  .populate('supplier', 'name type')
  .populate('passengers.airline', 'name iataCode')
  .populate('passengers.sector', 'name')
  .sort({ date: 1, createdAt: 1 });

  let periodDebit = 0; // Total billed
  let periodCredit = 0; // Total received
  let runningDue = openingDue;

  const rows = periodTxs.map(tx => {
    let debit = 0;
    let credit = 0;
    let description = '';

    if (tx.type === 'TICKET_INVOICE') {
      debit = Number(tx.totalSell) || 0;
      periodDebit += debit;
      runningDue += debit;
      const paxNames = (tx.passengers || []).map(p => p.name).join(', ');
      description = `Ticket Invoice (${tx.passengers?.length || 0} pax: ${paxNames})`;
    } else if (tx.type === 'VISA_INVOICE') {
      debit = Number(tx.totalSell) || 0;
      periodDebit += debit;
      runningDue += debit;
      const paxNames = (tx.passengers || []).map(p => p.name).join(', ');
      description = `Visa Invoice (${tx.passengers?.length || 0} pax: ${paxNames})`;
    } else if (tx.type === 'CLIENT_RECEIPT') {
      credit = Number(tx.amount) || 0;
      periodCredit += credit;
      runningDue -= credit;
      description = `Money Receipt (${tx.mode}) - ${tx.remarks || ''}`;
    } else if (tx.type === 'REFUND') {
      credit = Number(tx.clientRefundAmount || tx.amount) || 0;
      periodCredit += credit;
      runningDue -= credit;
      description = `Refund: ${tx.reason || ''}`;
    }

    return {
      _id: tx._id,
      ref: tx.ref,
      date: tx.date,
      type: tx.type,
      description,
      debit,
      credit,
      balance: Math.round(runningDue * 100) / 100
    };
  });

  const closingDue = Math.round(runningDue * 100) / 100;

  return {
    client: {
      _id: client._id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address
    },
    period: { from, to },
    openingDue: Math.round(openingDue * 100) / 100,
    periodDebit: Math.round(periodDebit * 100) / 100,
    periodCredit: Math.round(periodCredit * 100) / 100,
    closingDue,
    rows
  };
}

/**
 * 2. Supplier Statement
 */
export async function getSupplierStatement({ supplierId, from, to }) {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new Error('Supplier not found.');
  }

  const fromDate = from ? new Date(from) : new Date(0);
  const toDate = to ? new Date(to) : new Date(8640000000000000);
  if (to) {
    toDate.setHours(23, 59, 59, 999);
  }

  // 1. Calculate Opening Balance
  let openingBalance = 0;
  if (from && supplier.type !== 'DIRECT') {
    const priorTxs = await Transaction.find({
      supplier: supplier._id,
      status: 'ACTIVE',
      date: { $lt: fromDate }
    });

    for (const tx of priorTxs) {
      if (tx.type === 'TICKET_INVOICE' || tx.type === 'VISA_INVOICE') {
        const cost = Number(tx.totalBuy) || 0;
        if (supplier.type === 'PORTAL') openingBalance -= cost;
        else if (supplier.type === 'AGENCY') openingBalance += cost;
      } else if (tx.type === 'SUPPLIER_DEPOSIT' || tx.type === 'SUPPLIER_PAYMENT') {
        const amt = Number(tx.amount) || 0;
        if (supplier.type === 'PORTAL') openingBalance += amt;
        else if (supplier.type === 'AGENCY') openingBalance -= amt;
      }
    }
  }

  // 2. Fetch Period Transactions
  const periodTxs = await Transaction.find({
    supplier: supplier._id,
    status: 'ACTIVE',
    date: { $gte: fromDate, $lte: toDate }
  })
  .populate('client', 'name')
  .sort({ date: 1, createdAt: 1 });

  let totalCost = 0;
  let totalDepositsOrPayments = 0;
  let runningBalance = openingBalance;

  const rows = periodTxs.map(tx => {
    let cost = 0;
    let depositOrPayment = 0;
    let description = '';

    if (tx.type === 'TICKET_INVOICE' || tx.type === 'VISA_INVOICE') {
      cost = Number(tx.totalBuy) || 0;
      totalCost += cost;
      if (supplier.type === 'PORTAL') runningBalance -= cost;
      else if (supplier.type === 'AGENCY') runningBalance += cost;
      description = `${tx.type === 'TICKET_INVOICE' ? 'Ticket' : 'Visa'} Cost (Client: ${tx.client?.name || 'N/A'})`;
    } else if (tx.type === 'SUPPLIER_DEPOSIT' || tx.type === 'SUPPLIER_PAYMENT' || tx.type.startsWith('SUPPLIER_')) {
      depositOrPayment = Number(tx.amount) || 0;
      totalDepositsOrPayments += depositOrPayment;
      if (supplier.type === 'PORTAL') runningBalance += depositOrPayment;
      else if (supplier.type === 'AGENCY') runningBalance -= depositOrPayment;
      description = `${tx.type.replace('SUPPLIER_', '')} (${tx.mode || 'BANK'}) - ${tx.remarks || ''}`;
    }

    return {
      _id: tx._id,
      ref: tx.ref,
      date: tx.date,
      type: tx.type,
      description,
      cost,
      depositOrPayment,
      balance: Math.round(runningBalance * 100) / 100
    };
  });

  return {
    supplier: {
      _id: supplier._id,
      name: supplier.name,
      type: supplier.type,
      phone: supplier.phone,
      contactPerson: supplier.contactPerson
    },
    period: { from, to },
    openingBalance: Math.round(openingBalance * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalDepositsOrPayments: Math.round(totalDepositsOrPayments * 100) / 100,
    closingBalance: Math.round(runningBalance * 100) / 100,
    rows
  };
}

/**
 * 3. Profit Report (Ticket)
 */
export async function getTicketProfitReport({ from, to, airlineId, clientId, supplierId }) {
  const query = {
    type: 'TICKET_INVOICE',
    status: 'ACTIVE'
  };

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.date.$lte = toDate;
    }
  }

  if (clientId) query.client = clientId;
  if (supplierId) query.supplier = supplierId;

  const invoices = await Transaction.find(query)
    .populate('client', 'name')
    .populate('supplier', 'name type')
    .populate('passengers.airline', 'name iataCode')
    .sort({ date: -1 });

  let totalBuy = 0;
  let totalSell = 0;
  let totalProfit = 0;
  let totalPax = 0;

  const rows = [];

  for (const inv of invoices) {
    totalBuy += Number(inv.totalBuy) || 0;
    totalSell += Number(inv.totalSell) || 0;
    totalProfit += Number(inv.profit) || 0;
    totalPax += inv.passengers ? inv.passengers.length : 0;

    rows.push({
      _id: inv._id,
      ref: inv.ref,
      date: inv.date,
      clientName: inv.client?.name || 'N/A',
      supplierName: inv.supplier?.name || 'N/A',
      paxCount: inv.passengers ? inv.passengers.length : 0,
      passengers: inv.passengers || [],
      totalBuy: inv.totalBuy,
      totalSell: inv.totalSell,
      profit: inv.profit
    });
  }

  return {
    period: { from, to },
    summary: {
      totalInvoices: invoices.length,
      totalPax,
      totalBuy: Math.round(totalBuy * 100) / 100,
      totalSell: Math.round(totalSell * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      marginPercent: totalSell > 0 ? Math.round((totalProfit / totalSell) * 10000) / 100 : 0
    },
    rows
  };
}

/**
 * 4. Profit Report (Visa)
 */
export async function getVisaProfitReport({ from, to, sectorId, clientId, supplierId }) {
  const query = {
    type: 'VISA_INVOICE',
    status: 'ACTIVE'
  };

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.date.$lte = toDate;
    }
  }

  if (clientId) query.client = clientId;
  if (supplierId) query.supplier = supplierId;

  const invoices = await Transaction.find(query)
    .populate('client', 'name')
    .populate('supplier', 'name type')
    .populate('passengers.sector', 'name')
    .sort({ date: -1 });

  let totalBuy = 0;
  let totalSell = 0;
  let totalProfit = 0;
  let totalPax = 0;

  const rows = [];

  for (const inv of invoices) {
    totalBuy += Number(inv.totalBuy) || 0;
    totalSell += Number(inv.totalSell) || 0;
    totalProfit += Number(inv.profit) || 0;
    totalPax += inv.passengers ? inv.passengers.length : 0;

    rows.push({
      _id: inv._id,
      ref: inv.ref,
      date: inv.date,
      clientName: inv.client?.name || 'N/A',
      supplierName: inv.supplier?.name || 'N/A',
      paxCount: inv.passengers ? inv.passengers.length : 0,
      passengers: inv.passengers || [],
      totalBuy: inv.totalBuy,
      totalSell: inv.totalSell,
      profit: inv.profit
    });
  }

  return {
    period: { from, to },
    summary: {
      totalInvoices: invoices.length,
      totalPax,
      totalBuy: Math.round(totalBuy * 100) / 100,
      totalSell: Math.round(totalSell * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      marginPercent: totalSell > 0 ? Math.round((totalProfit / totalSell) * 10000) / 100 : 0
    },
    rows
  };
}

/**
 * 5. Client Aging Report (0-30, 31-60, 61-90, 90+ days)
 */
export async function getClientAgingReport() {
  const clients = await Client.find({ currentDue: { $gt: 0 } }).sort({ currentDue: -1 });
  const now = new Date();

  const agingData = [];
  let total0To30 = 0;
  let total31To60 = 0;
  let total61To90 = 0;
  let total90Plus = 0;
  let grandTotalDue = 0;

  for (const client of clients) {
    grandTotalDue += client.currentDue;
    // Look at unpaid transactions
    const txs = await Transaction.find({
      client: client._id,
      status: 'ACTIVE',
      type: { $in: ['TICKET_INVOICE', 'VISA_INVOICE'] }
    }).sort({ date: -1 });

    let b0_30 = 0, b31_60 = 0, b61_90 = 0, b90_plus = 0;

    for (const tx of txs) {
      const days = Math.floor((now - new Date(tx.date)) / (1000 * 60 * 60 * 24));
      const amount = tx.totalSell || 0;
      if (days <= 30) b0_30 += amount;
      else if (days <= 60) b31_60 += amount;
      else if (days <= 90) b61_90 += amount;
      else b90_plus += amount;
    }

    total0To30 += b0_30;
    total31To60 += b31_60;
    total61To90 += b61_90;
    total90Plus += b90_plus;

    agingData.push({
      clientId: client._id,
      clientName: client.name,
      phone: client.phone,
      currentDue: client.currentDue,
      bucket0_30: b0_30,
      bucket31_60: b31_60,
      bucket61_90: b61_90,
      bucket90Plus: b90_plus
    });
  }

  return {
    summary: {
      totalClientsWithDue: clients.length,
      grandTotalDue: Math.round(grandTotalDue * 100) / 100,
      total0To30: Math.round(total0To30 * 100) / 100,
      total31To60: Math.round(total31To60 * 100) / 100,
      total61To90: Math.round(total61To90 * 100) / 100,
      total90Plus: Math.round(total90Plus * 100) / 100
    },
    clients: agingData
  };
}
