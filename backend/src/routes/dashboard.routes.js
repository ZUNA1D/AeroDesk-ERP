import { Router } from 'express';
import {
  getDashboardSummary,
  getFilteredProfit,
  getExpiringDocuments
} from '../controllers/dashboard.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', getDashboardSummary);
router.get('/profit-filter', getFilteredProfit);
router.get('/expiring-documents', getExpiringDocuments);

export default router;
