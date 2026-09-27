import { Router } from 'express';
import {
  handleClientStatement,
  handleSupplierStatement,
  handleTicketProfitReport,
  handleVisaProfitReport,
  handleClientAgingReport
} from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/client-statement', handleClientStatement);
router.get('/supplier-statement', handleSupplierStatement);
router.get('/profit-ticket', handleTicketProfitReport);
router.get('/profit-visa', handleVisaProfitReport);
router.get('/client-aging', handleClientAgingReport);

export default router;
