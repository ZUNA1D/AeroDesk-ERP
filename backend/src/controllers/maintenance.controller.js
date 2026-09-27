import { recalculateAllBalances } from '../services/transaction.service.js';

export async function handleRecalculateBalances(req, res, next) {
  try {
    const result = await recalculateAllBalances(req.user._id);
    res.json({
      message: 'All client dues and supplier balances successfully recalculated from transaction history.',
      result
    });
  } catch (err) {
    next(err);
  }
}
