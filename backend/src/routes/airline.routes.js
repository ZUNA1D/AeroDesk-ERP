import { Router } from 'express';
import { listAirlines, createAirline, deleteAirline } from '../controllers/airline.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listAirlines);
router.post('/', requireRole('STAFF', 'MANAGER', 'ADMIN'), createAirline);
router.delete('/:id', requireRole('MANAGER', 'ADMIN'), deleteAirline);

export default router;
