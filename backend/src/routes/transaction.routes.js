import { Router } from 'express';
import {
  listTransactions,
  getTransactionById,
  handleCreateTicketInvoice,
  handleCreateVisaInvoice,
  handleCreateClientReceipt,
  handleCreateSupplierTxn,
  handleCreateExpense,
  handleCreateRefund,
  handleEditTransaction,
  handleVoidTransaction,
  handleHardDeleteTransaction,
  handleGetReceiptPdf
} from '../controllers/transaction.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Printable receipt voucher view (strictly isolated per authenticated agency)
router.get('/:id/receipt-pdf', handleGetReceiptPdf);

router.get('/', listTransactions);
router.get('/:id', getTransactionById);

router.post('/ticket-invoice', requireRole('STAFF', 'MANAGER', 'ADMIN'), handleCreateTicketInvoice);
router.post('/visa-invoice', requireRole('STAFF', 'MANAGER', 'ADMIN'), handleCreateVisaInvoice);
router.post('/client-receipt', requireRole('STAFF', 'MANAGER', 'ADMIN'), handleCreateClientReceipt);
router.post('/supplier-txn', requireRole('STAFF', 'MANAGER', 'ADMIN'), handleCreateSupplierTxn);
router.post('/expense', requireRole('STAFF', 'MANAGER', 'ADMIN'), handleCreateExpense);
router.post('/refund', requireRole('STAFF', 'MANAGER', 'ADMIN'), handleCreateRefund);

router.patch('/:id', requireRole('MANAGER', 'ADMIN'), handleEditTransaction);
router.post('/:id/void', requireRole('MANAGER', 'ADMIN'), handleVoidTransaction);
router.delete('/:id', requireRole('ADMIN'), handleHardDeleteTransaction);

export default router;
