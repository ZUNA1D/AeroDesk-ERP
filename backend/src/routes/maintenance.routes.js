import { Router } from 'express';
import { handleRecalculateBalances } from '../controllers/maintenance.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.post('/recalculate-balances', handleRecalculateBalances);

export default router;
