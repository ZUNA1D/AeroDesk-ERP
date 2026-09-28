import mongoose from 'mongoose';
import { Client } from '../models/Client.js';
import { Supplier } from '../models/Supplier.js';
import { Transaction } from '../models/transaction/Transaction.js';

export async function getDashboardSummary(req, res, next) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const agencyObjectId = new mongoose.Types.ObjectId(req.agencyId);

    const [
      clientDueAgg,
      portalBalanceAgg,
      agencyDueAgg,
      allTimeProfitAgg,
      todaySalesAgg,
      recentTransactions,
      clientCount,
      supplierCount
    ] = await Promise.all([
      // Total Client Due (isolated to this agency)
      Client.aggregate([
        { $match: { agency: agencyObjectId } },
        { $group: { _id: null, total: { $sum: '$currentDue' } } }
      ]),

      // Total Portal Wallet Balance (isolated to this agency)
      Supplier.aggregate([
        { $match: { agency: agencyObjectId, type: 'PORTAL', active: true } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]),

      // Total Agency Due (isolated to this agency)
      Supplier.aggregate([
        { $match: { agency: agencyObjectId, type: 'AGENCY', active: true } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]),

      // All-Time Profit on ACTIVE Ticket & Visa Invoices (isolated to this agency)
      Transaction.aggregate([
        {
          $match: {
            agency: agencyObjectId,
            type: { $in: ['TICKET_INVOICE', 'VISA_INVOICE'] },
            status: 'ACTIVE'
          }
        },
        {
          $group: {
            _id: null,
            totalProfit: { $sum: { $subtract: ['$totalSell', '$totalBuy'] } },
            totalSell: { $sum: '$totalSell' },
            totalBuy: { $sum: '$totalBuy' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Today's Sales & Profit (isolated to this agency)
      Transaction.aggregate([
        {
          $match: {
            agency: agencyObjectId,
            type: { $in: ['TICKET_INVOICE', 'VISA_INVOICE'] },
            status: 'ACTIVE',
            date: { $gte: todayStart }
          }
        },
        {
          $group: {
            _id: null,
            totalSell: { $sum: '$totalSell' },
            totalProfit: { $sum: { $subtract: ['$totalSell', '$totalBuy'] } },
            count: { $sum: 1 }
          }
        }
      ]),

      // Recent Transactions (isolated to this agency)
      Transaction.find({ agency: req.agencyId })
        .populate('client', 'name')
        .populate('supplier', 'name type')
        .populate('createdBy', 'name')
        .sort({ date: -1, createdAt: -1 })
        .limit(8),

      Client.countDocuments({ agency: req.agencyId }),
      Supplier.countDocuments({ agency: req.agencyId, active: true })
    ]);

    const totalClientDue = clientDueAgg[0]?.total || 0;
    const portalWalletTotal = portalBalanceAgg[0]?.total || 0;
    const agencyDueTotal = agencyDueAgg[0]?.total || 0;
    const allTimeProfit = allTimeProfitAgg[0]?.totalProfit || 0;
    const allTimeSales = allTimeProfitAgg[0]?.totalSell || 0;
    const todaySales = todaySalesAgg[0]?.totalSell || 0;
    const todayProfit = todaySalesAgg[0]?.totalProfit || 0;

    res.json({
      summary: {
        totalClientDue: Math.round(totalClientDue * 100) / 100,
        portalWalletTotal: Math.round(portalWalletTotal * 100) / 100,
        agencyDueTotal: Math.round(agencyDueTotal * 100) / 100,
        allTimeProfit: Math.round(allTimeProfit * 100) / 100,
        allTimeSales: Math.round(allTimeSales * 100) / 100,
        todaySales: Math.round(todaySales * 100) / 100,
        todayProfit: Math.round(todayProfit * 100) / 100,
        clientCount,
        supplierCount
      },
      recentTransactions
    });
  } catch (err) {
    next(err);
  }
}

export async function getFilteredProfit(req, res, next) {
  try {
    const { from, to } = req.query;

    const match = {
      agency: new mongoose.Types.ObjectId(req.agencyId),
      type: { $in: ['TICKET_INVOICE', 'VISA_INVOICE'] },
      status: 'ACTIVE'
    };

    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        match.date.$lte = toDate;
      }
    }

    const profitAgg = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalSell: { $sum: '$totalSell' },
          totalBuy: { $sum: '$totalBuy' },
          totalProfit: { $sum: { $subtract: ['$totalSell', '$totalBuy'] } },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = profitAgg[0] || { totalSell: 0, totalBuy: 0, totalProfit: 0, count: 0 };

    res.json({
      period: { from, to },
      totalSell: Math.round(result.totalSell * 100) / 100,
      totalBuy: Math.round(result.totalBuy * 100) / 100,
      totalProfit: Math.round(result.totalProfit * 100) / 100,
      count: result.count
    });
  } catch (err) {
    next(err);
  }
}

export async function getExpiringDocuments(req, res, next) {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 90); // Next 90 days

    const expiringClients = await Client.find({
      agency: req.agencyId,
      passportExpiry: { $gte: now, $lte: futureDate }
    }).sort({ passportExpiry: 1 });

    res.json({ expiringClients });
  } catch (err) {
    next(err);
  }
}
