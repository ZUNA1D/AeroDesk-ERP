import mongoose from 'mongoose';
import { Transaction } from '../models/transaction/Transaction.js';
import { TicketInvoice } from '../models/transaction/TicketInvoice.js';
import { VisaInvoice } from '../models/transaction/VisaInvoice.js';
import { ClientReceipt } from '../models/transaction/ClientReceipt.js';
import { SupplierDeposit, SupplierPayment, SupplierDebitMemo, SupplierCreditMemo } from '../models/transaction/SupplierTxn.js';
import { Refund, Reissue } from '../models/transaction/RefundReissue.js';
import { Expense } from '../models/transaction/Expense.js';
import { Client } from '../models/Client.js';
import { Supplier } from '../models/Supplier.js';
import { getNextRef } from './counter.service.js';
import { writeAuditLog } from './audit.service.js';

/**
 * Helper to run an operation inside a Mongoose session transaction if supported
 */
export async function withTransactionHelper(fn) {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_) {}
    }
    // If transactions are not supported by the current MongoDB deployment, fallback without session
    if (err.message && (err.message.includes('replica set') || err.message.includes('Transaction numbers are only allowed on a replica set member or mongos'))) {
      console.warn('[TransactionService] MongoDB replica set not active for session transaction; executing in fallback non-session mode.');
      return await fn(null);
    }
    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

/**
 * Ensure or lookup client by name/id
 */
export async function resolveClient(clientIdOrName, userId = null, session = null) {
  if (!clientIdOrName) return null;

  if (mongoose.Types.ObjectId.isValid(clientIdOrName)) {
    const existing = await Client.findById(clientIdOrName).session(session);
    if (existing) return existing;
  }

  const nameUpper = String(clientIdOrName).trim().toUpperCase();
  let client = await Client.findOne({ name: nameUpper }).session(session);
  if (!client) {
    const created = await Client.create([{
      name: nameUpper,
      createdBy: userId
    }], { session });
    client = created[0];
  }
  return client;
}

/**
 * Apply financial effect for a transaction
 */
async function applyEffect(tx, multiplier = 1, session = null) {
  // multiplier: +1 when creating/applying, -1 when reversing/voiding

  // 1. Client Due effects
  if (tx.client) {
    const client = await Client.findById(tx.client).session(session);
    if (client) {
      let clientDelta = 0;

      if (tx.type === 'TICKET_INVOICE' || tx.type === 'VISA_INVOICE') {
        // Invoices increase client due
        clientDelta = (Number(tx.totalSell) || 0) * multiplier;
      } else if (tx.type === 'CLIENT_RECEIPT') {
        // Receipts reduce client due
        clientDelta = -(Number(tx.amount) || 0) * multiplier;
      } else if (tx.type === 'REFUND') {
        // Refund given back to client reduces their due/adds credit
        clientDelta = -(Number(tx.clientRefundAmount || tx.amount) || 0) * multiplier;
      }

      client.currentDue = Math.round(((Number(client.currentDue) || 0) + clientDelta) * 100) / 100;
      await client.save({ session });
    }
  }

  // 2. Supplier Balance effects
  if (tx.supplier) {
    const supplier = await Supplier.findById(tx.supplier).session(session);
    if (supplier) {
      let supplierDelta = 0;
      const type = supplier.type; // 'PORTAL' | 'AGENCY' | 'DIRECT'

      if (type === 'DIRECT' || supplier.isSelf) {
        // DIRECT / in-house stock has NO balance tracking
        supplierDelta = 0;
      } else if (tx.type === 'TICKET_INVOICE' || tx.type === 'VISA_INVOICE') {
        const cost = Number(tx.totalBuy) || 0;
        if (type === 'PORTAL') {
          // Portal is prepaid: cost draws down wallet (-cost)
          supplierDelta = -cost * multiplier;
        } else if (type === 'AGENCY') {
          // Agency is payable credit: cost increases debt (+cost)
          supplierDelta = cost * multiplier;
        }
      } else if (tx.type === 'SUPPLIER_DEPOSIT') {
        // Deposit tops up Portal wallet (+amount) or reduces Agency payable (-amount)
        const amt = Number(tx.amount) || 0;
        if (type === 'PORTAL') {
          supplierDelta = amt * multiplier;
        } else if (type === 'AGENCY') {
          supplierDelta = -amt * multiplier;
        }
      } else if (tx.type === 'SUPPLIER_PAYMENT') {
        // Payment reduces Agency payable (-amount) or tops up Portal (+amount)
        const amt = Number(tx.amount) || 0;
        if (type === 'AGENCY') {
          supplierDelta = -amt * multiplier;
        } else if (type === 'PORTAL') {
          supplierDelta = amt * multiplier;
        }
      } else if (tx.type === 'SUPPLIER_DEBIT_MEMO') {
        // ADM (debit memo against agency = we owe more / portal balance decreases)
        const amt = Number(tx.amount) || 0;
        if (type === 'AGENCY') {
          supplierDelta = amt * multiplier;
        } else if (type === 'PORTAL') {
          supplierDelta = -amt * multiplier;
        }
      } else if (tx.type === 'SUPPLIER_CREDIT_MEMO') {
        // ACM (credit memo = we get credited)
        const amt = Number(tx.amount) || 0;
        if (type === 'AGENCY') {
          supplierDelta = -amt * multiplier;
        } else if (type === 'PORTAL') {
          supplierDelta = amt * multiplier;
        }
      } else if (tx.type === 'REFUND') {
        // Supplier refund received
        const amt = Number(tx.supplierRefundAmount || tx.amount) || 0;
        if (type === 'PORTAL') {
          supplierDelta = amt * multiplier;
        } else if (type === 'AGENCY') {
          supplierDelta = -amt * multiplier;
        }
      }

      supplier.balance = Math.round(((Number(supplier.balance) || 0) + supplierDelta) * 100) / 100;
      await supplier.save({ session });
    }
  }
}

/**
 * 1. Create Ticket Invoice
 */
export async function createTicketInvoice(data, userId) {
  return await withTransactionHelper(async (session) => {
    const {
      date,
      clientId,
      clientName,
      supplierId,
      passengers = [],
      notes,
      branch
    } = data;

    if (!passengers || passengers.length === 0) {
      throw new Error('At least one passenger row is required.');
    }

    let totalBuy = 0;
    let totalSell = 0;

    const formattedPassengers = passengers.map(p => {
      const cost = Number(p.cost) || 0;
      const sell = Number(p.sell) || 0;
      const profit = sell - cost;
      totalBuy += cost;
      totalSell += sell;

      return {
        name: String(p.name || '').trim().toUpperCase(),
        ticketNo: p.ticketNo ? String(p.ticketNo).trim() : '',
        pnr: p.pnr ? String(p.pnr).trim().toUpperCase() : '',
        airline: p.airline || null,
        route: p.route ? String(p.route).trim().toUpperCase() : '',
        cost,
        sell,
        profit
      };
    });

    const profit = totalSell - totalBuy;

    const client = await resolveClient(clientId || clientName, userId, session);
    if (!client) {
      throw new Error('Client is required.');
    }

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) {
      throw new Error('Supplier is required.');
    }

    const ref = await getNextRef('INVT', session);

    const invoiceDocs = await TicketInvoice.create([{
      ref,
      date: date ? new Date(date) : new Date(),
      status: 'ACTIVE',
      client: client._id,
      supplier: supplier._id,
      passengers: formattedPassengers,
      totalBuy,
      totalSell,
      profit,
      notes,
      branch,
      createdBy: userId
    }], { session });

    const invoice = invoiceDocs[0];

    // Apply financial effects (+1)
    await applyEffect(invoice, +1, session);

    // Audit log
    await writeAuditLog({
      entityType: 'Transaction',
      entityId: invoice._id,
      action: 'CREATE',
      performedBy: userId,
      details: `Created Ticket Invoice ${ref} for Client ${client.name}`,
      after: invoice,
      session
    });

    return invoice;
  });
}

/**
 * 2. Create Visa Invoice
 */
export async function createVisaInvoice(data, userId) {
  return await withTransactionHelper(async (session) => {
    const {
      date,
      clientId,
      clientName,
      supplierId,
      passengers = [],
      notes,
      branch
    } = data;

    if (!passengers || passengers.length === 0) {
      throw new Error('At least one visa passenger row is required.');
    }

    let totalBuy = 0;
    let totalSell = 0;

    const formattedPassengers = passengers.map(p => {
      const cost = Number(p.cost) || 0;
      const sell = Number(p.sell) || 0;
      const profit = sell - cost;
      totalBuy += cost;
      totalSell += sell;

      return {
        name: String(p.name || '').trim().toUpperCase(),
        visaNo: p.visaNo ? String(p.visaNo).trim() : '',
        sector: p.sector || null,
        cost,
        sell,
        profit
      };
    });

    const profit = totalSell - totalBuy;

    const client = await resolveClient(clientId || clientName, userId, session);
    if (!client) {
      throw new Error('Client is required.');
    }

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) {
      throw new Error('Supplier is required.');
    }

    const ref = await getNextRef('VISA', session);

    const invoiceDocs = await VisaInvoice.create([{
      ref,
      date: date ? new Date(date) : new Date(),
      status: 'ACTIVE',
      client: client._id,
      supplier: supplier._id,
      passengers: formattedPassengers,
      totalBuy,
      totalSell,
      profit,
      notes,
      branch,
      createdBy: userId
    }], { session });

    const invoice = invoiceDocs[0];

    // Apply financial effects (+1)
    await applyEffect(invoice, +1, session);

    // Audit log
    await writeAuditLog({
      entityType: 'Transaction',
      entityId: invoice._id,
      action: 'CREATE',
      performedBy: userId,
      details: `Created Visa Invoice ${ref} for Client ${client.name}`,
      after: invoice,
      session
    });

    return invoice;
  });
}

/**
 * 3. Create Client Receipt
 */
export async function createClientReceipt(data, userId) {
  return await withTransactionHelper(async (session) => {
    const {
      date,
      clientId,
      clientName,
      amount,
      mode = 'CASH',
      remarks,
      bankName,
      chequeNo,
      transactionId,
      branch
    } = data;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Receipt amount must be greater than zero.');
    }

    const client = await resolveClient(clientId || clientName, userId, session);
    if (!client) {
      throw new Error('Client is required.');
    }

    const ref = await getNextRef('CRV', session);

    const receiptDocs = await ClientReceipt.create([{
      ref,
      date: date ? new Date(date) : new Date(),
      status: 'ACTIVE',
      client: client._id,
      amount: numAmount,
      mode,
      remarks,
      bankName,
      chequeNo,
      transactionId,
      branch,
      createdBy: userId
    }], { session });

    const receipt = receiptDocs[0];

    // Apply financial effect (+1) -> reduces client due
    await applyEffect(receipt, +1, session);

    // Audit log
    await writeAuditLog({
      entityType: 'Transaction',
      entityId: receipt._id,
      action: 'CREATE',
      performedBy: userId,
      details: `Received ${numAmount} BDT from Client ${client.name} via ${mode}`,
      after: receipt,
      session
    });

    return receipt;
  });
}

/**
 * 4. Create Supplier Transaction (Deposit, Payment, ADM, ACM)
 */
export async function createSupplierTxn(data, userId) {
  return await withTransactionHelper(async (session) => {
    const {
      date,
      supplierId,
      amount,
      type, // 'SUPPLIER_DEPOSIT' | 'SUPPLIER_PAYMENT' | 'SUPPLIER_DEBIT_MEMO' | 'SUPPLIER_CREDIT_MEMO'
      subtype,
      mode = 'BANK',
      remarks,
      bspRef,
      branch
    } = data;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Transaction amount must be greater than zero.');
    }

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) {
      throw new Error('Supplier is required.');
    }

    let finalType = type;
    if (!finalType) {
      if (subtype === 'ADM') finalType = 'SUPPLIER_DEBIT_MEMO';
      else if (subtype === 'ACM') finalType = 'SUPPLIER_CREDIT_MEMO';
      else if (supplier.type === 'PORTAL') finalType = 'SUPPLIER_DEPOSIT';
      else finalType = 'SUPPLIER_PAYMENT';
    }

    let prefix = 'DEP';
    if (finalType === 'SUPPLIER_PAYMENT') prefix = 'PAY';
    else if (finalType === 'SUPPLIER_DEBIT_MEMO') prefix = 'ADM';
    else if (finalType === 'SUPPLIER_CREDIT_MEMO') prefix = 'ACM';

    const ref = await getNextRef(prefix, session);

    const Model = finalType === 'SUPPLIER_DEPOSIT' ? SupplierDeposit :
                  finalType === 'SUPPLIER_PAYMENT' ? SupplierPayment :
                  finalType === 'SUPPLIER_DEBIT_MEMO' ? SupplierDebitMemo : SupplierCreditMemo;

    const txnDocs = await Model.create([{
      ref,
      type: finalType,
      date: date ? new Date(date) : new Date(),
      status: 'ACTIVE',
      supplier: supplier._id,
      amount: numAmount,
      subtype: subtype || (finalType === 'SUPPLIER_DEPOSIT' ? 'DEPOSIT' : 'PAYMENT'),
      mode,
      remarks,
      bspRef,
      branch,
      createdBy: userId
    }], { session });

    const txn = txnDocs[0];

    // Apply financial effect (+1)
    await applyEffect(txn, +1, session);

    // Audit log
    await writeAuditLog({
      entityType: 'Transaction',
      entityId: txn._id,
      action: 'CREATE',
      performedBy: userId,
      details: `${finalType} of ${numAmount} BDT for Supplier ${supplier.name}`,
      after: txn,
      session
    });

    return txn;
  });
}

/**
 * 5. Create Expense
 */
export async function createExpense(data, userId) {
  return await withTransactionHelper(async (session) => {
    const { date, categoryId, amount, remarks, paidFrom = 'CASH', branch } = data;
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }

    const ref = await getNextRef('EXP', session);

    const docs = await Expense.create([{
      ref,
      date: date ? new Date(date) : new Date(),
      status: 'ACTIVE',
      category: categoryId,
      amount: numAmount,
      remarks,
      paidFrom,
      branch,
      createdBy: userId
    }], { session });

    const expense = docs[0];

    await writeAuditLog({
      entityType: 'Transaction',
      entityId: expense._id,
      action: 'CREATE',
      performedBy: userId,
      details: `Created Expense ${ref} for ${numAmount} BDT`,
      after: expense,
      session
    });

    return expense;
  });
}

/**
 * 6. Create Refund / Reissue
 */
export async function createRefund(data, userId) {
  return await withTransactionHelper(async (session) => {
    const { parentTransactionId, clientRefundAmount, supplierRefundAmount, serviceCharge = 0, reason, branch } = data;

    const parent = await Transaction.findById(parentTransactionId).session(session);
    if (!parent) {
      throw new Error('Parent transaction not found.');
    }

    const ref = await getNextRef('REF', session);

    const docs = await Refund.create([{
      ref,
      date: new Date(),
      status: 'ACTIVE',
      parentTransaction: parent._id,
      client: parent.client,
      supplier: parent.supplier,
      amount: Number(clientRefundAmount) || 0,
      clientRefundAmount: Number(clientRefundAmount) || 0,
      supplierRefundAmount: Number(supplierRefundAmount) || 0,
      serviceCharge: Number(serviceCharge) || 0,
      reason,
      branch,
      createdBy: userId
    }], { session });

    const refund = docs[0];
    await applyEffect(refund, +1, session);

    await writeAuditLog({
      entityType: 'Transaction',
      entityId: refund._id,
      action: 'CREATE',
      performedBy: userId,
      details: `Created Refund ${ref} for parent ${parent.ref}`,
      after: refund,
      session
    });

    return refund;
  });
}

/**
 * 7. Edit Transaction (The reverse-then-reapply pattern)
 */
export async function editTransaction(id, newData, userId) {
  return await withTransactionHelper(async (session) => {
    const oldTx = await Transaction.findById(id).session(session);
    if (!oldTx) {
      throw new Error('Transaction not found.');
    }
    if (oldTx.status === 'VOIDED') {
      throw new Error('Cannot edit a voided transaction.');
    }

    // Step 1: Fully REVERSE old transaction's financial effect (-1)
    await applyEffect(oldTx, -1, session);

    // Step 2: Update fields based on type
    if (oldTx.type === 'TICKET_INVOICE' || oldTx.type === 'VISA_INVOICE') {
      const passengers = newData.passengers || [];
      if (passengers.length === 0) {
        throw new Error('At least one passenger row is required.');
      }

      let totalBuy = 0;
      let totalSell = 0;

      const formattedPassengers = passengers.map(p => {
        const cost = Number(p.cost) || 0;
        const sell = Number(p.sell) || 0;
        const profit = sell - cost;
        totalBuy += cost;
        totalSell += sell;

        return {
          name: String(p.name || '').trim().toUpperCase(),
          ticketNo: p.ticketNo ? String(p.ticketNo).trim() : '',
          visaNo: p.visaNo ? String(p.visaNo).trim() : '',
          pnr: p.pnr ? String(p.pnr).trim().toUpperCase() : '',
          airline: p.airline || null,
          sector: p.sector || null,
          route: p.route ? String(p.route).trim().toUpperCase() : '',
          cost,
          sell,
          profit
        };
      });

      const client = await resolveClient(newData.clientId || newData.clientName || oldTx.client, userId, session);
      const supplierId = newData.supplierId || oldTx.supplier;

      oldTx.date = newData.date ? new Date(newData.date) : oldTx.date;
      oldTx.client = client._id;
      oldTx.supplier = supplierId;
      oldTx.passengers = formattedPassengers;
      oldTx.totalBuy = totalBuy;
      oldTx.totalSell = totalSell;
      oldTx.profit = totalSell - totalBuy;
      oldTx.notes = newData.notes !== undefined ? newData.notes : oldTx.notes;
    } else if (oldTx.type === 'CLIENT_RECEIPT') {
      const numAmount = Number(newData.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Amount must be greater than zero.');
      }

      const client = await resolveClient(newData.clientId || newData.clientName || oldTx.client, userId, session);
      oldTx.date = newData.date ? new Date(newData.date) : oldTx.date;
      oldTx.client = client._id;
      oldTx.amount = numAmount;
      oldTx.mode = newData.mode || oldTx.mode;
      oldTx.remarks = newData.remarks !== undefined ? newData.remarks : oldTx.remarks;
      oldTx.bankName = newData.bankName !== undefined ? newData.bankName : oldTx.bankName;
      oldTx.chequeNo = newData.chequeNo !== undefined ? newData.chequeNo : oldTx.chequeNo;
      oldTx.transactionId = newData.transactionId !== undefined ? newData.transactionId : oldTx.transactionId;
    } else if (oldTx.type.startsWith('SUPPLIER_')) {
      const numAmount = Number(newData.amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Amount must be greater than zero.');
      }

      oldTx.date = newData.date ? new Date(newData.date) : oldTx.date;
      oldTx.supplier = newData.supplierId || oldTx.supplier;
      oldTx.amount = numAmount;
      oldTx.mode = newData.mode || oldTx.mode;
      oldTx.remarks = newData.remarks !== undefined ? newData.remarks : oldTx.remarks;
      oldTx.bspRef = newData.bspRef !== undefined ? newData.bspRef : oldTx.bspRef;
    } else if (oldTx.type === 'EXPENSE') {
      oldTx.date = newData.date ? new Date(newData.date) : oldTx.date;
      oldTx.category = newData.categoryId || oldTx.category;
      oldTx.amount = Number(newData.amount) || oldTx.amount;
      oldTx.remarks = newData.remarks !== undefined ? newData.remarks : oldTx.remarks;
      oldTx.paidFrom = newData.paidFrom || oldTx.paidFrom;
    }

    await oldTx.save({ session });

    // Step 3: Apply NEW financial effect (+1)
    await applyEffect(oldTx, +1, session);

    // Audit log
    await writeAuditLog({
      entityType: 'Transaction',
      entityId: oldTx._id,
      action: 'UPDATE',
      performedBy: userId,
      details: `Updated Transaction ${oldTx.ref}`,
      after: oldTx,
      session
    });

    return oldTx;
  });
}

/**
 * 8. Void Transaction
 */
export async function voidTransaction(id, reason, userId) {
  return await withTransactionHelper(async (session) => {
    if (!reason || !reason.trim()) {
      throw new Error('Void reason is required.');
    }

    const tx = await Transaction.findById(id).session(session);
    if (!tx) {
      throw new Error('Transaction not found.');
    }
    if (tx.status === 'VOIDED') {
      throw new Error('Transaction is already voided.');
    }

    const beforeState = tx.toObject();

    // Step 1: Fully REVERSE financial effect (-1)
    await applyEffect(tx, -1, session);

    // Step 2: Mark as VOIDED
    tx.status = 'VOIDED';
    tx.voidReason = reason.trim();
    tx.voidedBy = userId;
    tx.voidedAt = new Date();

    await tx.save({ session });

    // Audit log
    await writeAuditLog({
      entityType: 'Transaction',
      entityId: tx._id,
      action: 'VOID',
      performedBy: userId,
      details: `Voided Transaction ${tx.ref}. Reason: ${reason}`,
      before: beforeState,
      after: tx,
      session
    });

    return tx;
  });
}

/**
 * 9. Hard Delete Transaction (Admin only)
 */
export async function hardDeleteTransaction(id, userId) {
  return await withTransactionHelper(async (session) => {
    const tx = await Transaction.findById(id).session(session);
    if (!tx) {
      throw new Error('Transaction not found.');
    }

    const beforeState = tx.toObject();

    // If ACTIVE, reverse effects before deleting
    if (tx.status === 'ACTIVE') {
      await applyEffect(tx, -1, session);
    }

    await Transaction.deleteOne({ _id: tx._id }).session(session);

    // Audit log
    await writeAuditLog({
      entityType: 'Transaction',
      entityId: tx._id,
      action: 'DELETE',
      performedBy: userId,
      details: `Permanently deleted Transaction ${tx.ref}`,
      before: beforeState,
      after: null,
      session
    });

    return { success: true, deletedRef: tx.ref };
  });
}

/**
 * 10. Recalculate All Balances (Admin Safety Net)
 */
export async function recalculateAllBalances(userId) {
  return await withTransactionHelper(async (session) => {
    // 1. Reset all cached balances to 0
    await Client.updateMany({}, { $set: { currentDue: 0 } }, { session });
    await Supplier.updateMany({}, { $set: { balance: 0 } }, { session });

    // 2. Fetch all ACTIVE transactions ordered chronologically
    const transactions = await Transaction.find({ status: 'ACTIVE' })
      .sort({ date: 1, createdAt: 1 })
      .session(session);

    // 3. Replay effects for each active transaction
    for (const tx of transactions) {
      await applyEffect(tx, +1, session);
    }

    // Audit log
    await writeAuditLog({
      entityType: 'Settings',
      entityId: new mongoose.Types.ObjectId(),
      action: 'UPDATE',
      performedBy: userId,
      details: `Recalculated all client and supplier balances from ${transactions.length} active transactions.`,
      session
    });

    const clientCount = await Client.countDocuments().session(session);
    const supplierCount = await Supplier.countDocuments().session(session);

    return {
      success: true,
      processedTransactions: transactions.length,
      clientsUpdated: clientCount,
      suppliersUpdated: supplierCount
    };
  });
}
