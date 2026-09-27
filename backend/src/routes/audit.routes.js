import { Router } from 'express';
import { listAuditLogs } from '../controllers/audit.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', listAuditLogs);

export default router;
