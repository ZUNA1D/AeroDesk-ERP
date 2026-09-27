import { Router } from 'express';
import { listSectors, createSector, deleteSector } from '../controllers/sector.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listSectors);
router.post('/', requireRole('STAFF', 'MANAGER', 'ADMIN'), createSector);
router.delete('/:id', requireRole('MANAGER', 'ADMIN'), deleteSector);

export default router;
