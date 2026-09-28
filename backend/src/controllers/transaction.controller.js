import { Transaction } from '../models/transaction/Transaction.js';
import { ClientReceipt } from '../models/transaction/ClientReceipt.js';
import { Client } from '../models/Client.js';
import {
  createTicketInvoice,
  createVisaInvoice,
  createClientReceipt,
  createSupplierTxn,
  createExpense,
  createRefund,
  editTransaction,
  voidTransaction,
  hardDeleteTransaction
} from '../services/transaction.service.js';
import { renderMoneyReceiptHtml } from '../services/pdf.service.js';

export async function listTransactions(req, res, next) {
  try {
    const {
      search,
      type,
      status,
      clientId,
      supplierId,
      from,
      to,
      sort = '-date',
      page = 1,
      limit = 50
    } = req.query;

    const query = { agency: req.agencyId };

    if (status) {
      query.status = status;
    }

    if (type) {
      if (type.includes(',')) {
        query.type = { $in: type.split(',') };
      } else {
        query.type = type;
      }
    }

    if (clientId) {
      query.client = clientId;
    }

    if (supplierId) {
      query.supplier = supplierId;
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = [
        {
          $or: [
            { ref: searchRegex },
            { 'passengers.name': searchRegex },
            { 'passengers.ticketNo': searchRegex },
            { 'passengers.pnr': searchRegex },
            { 'passengers.visaNo': searchRegex },
            { remarks: searchRegex },
            { voidReason: searchRegex }
          ]
        }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortObj = { date: -1, createdAt: -1 };
    if (sort === 'date') sortObj = { date: 1, createdAt: 1 };
    else if (sort === '-date') sortObj = { date: -1, createdAt: -1 };
    else if (sort === 'ref') sortObj = { ref: 1 };
    else if (sort === '-ref') sortObj = { ref: -1 };
    else if (sort === 'amount') sortObj = { totalSell: -1, amount: -1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('client', 'name phone email currentDue')
        .populate('supplier', 'name type balance isSelf')
        .populate('createdBy', 'name')
        .populate('voidedBy', 'name')
        .populate('passengers.airline', 'name iataCode')
        .populate('passengers.sector', 'name')
        .populate('category', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(query)
    ]);

    res.json({
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findOne({ _id: id, agency: req.agencyId })
      .populate('client')
      .populate('supplier')
      .populate('createdBy', 'name email')
      .populate('voidedBy', 'name email')
      .populate('passengers.airline')
      .populate('passengers.sector')
      .populate('category');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    res.json({ transaction });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateTicketInvoice(req, res, next) {
  try {
    const invoice = await createTicketInvoice(req.body, req.user._id, req.agencyId);
    res.status(201).json({ message: 'Ticket invoice issued successfully.', transaction: invoice });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateVisaInvoice(req, res, next) {
  try {
    const invoice = await createVisaInvoice(req.body, req.user._id, req.agencyId);
    res.status(201).json({ message: 'Visa invoice issued successfully.', transaction: invoice });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateClientReceipt(req, res, next) {
  try {
    const receipt = await createClientReceipt(req.body, req.user._id, req.agencyId);
    res.status(201).json({ message: 'Client receipt recorded successfully.', transaction: receipt });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateSupplierTxn(req, res, next) {
  try {
    const txn = await createSupplierTxn(req.body, req.user._id, req.agencyId);
    res.status(201).json({ message: 'Supplier transaction recorded successfully.', transaction: txn });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateExpense(req, res, next) {
  try {
    const expense = await createExpense(req.body, req.user._id, req.agencyId);
    res.status(201).json({ message: 'Expense recorded successfully.', transaction: expense });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateRefund(req, res, next) {
  try {
    const refund = await createRefund(req.body, req.user._id, req.agencyId);
    res.status(201).json({ message: 'Refund recorded successfully.', transaction: refund });
  } catch (err) {
    next(err);
  }
}

export async function handleEditTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await editTransaction(id, req.body, req.user._id, req.agencyId);
    res.json({ message: 'Transaction updated successfully.', transaction: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleVoidTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const voided = await voidTransaction(id, reason, req.user._id, req.agencyId);
    res.json({ message: 'Transaction voided successfully.', transaction: voided });
  } catch (err) {
    next(err);
  }
}

export async function handleHardDeleteTransaction(req, res, next) {
  try {
    const { id } = req.params;
    const result = await hardDeleteTransaction(id, req.user._id, req.agencyId);
    res.json({ message: 'Transaction deleted permanently.', result });
  } catch (err) {
    next(err);
  }
}

export async function handleGetReceiptPdf(req, res, next) {
  try {
    const { id } = req.params;
    const receipt = await Transaction.findOne({ _id: id, agency: req.agencyId }).populate('client');
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found.' });
    }

    const html = await renderMoneyReceiptHtml(receipt, receipt.client, req.agencyId);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    next(err);
  }
}
