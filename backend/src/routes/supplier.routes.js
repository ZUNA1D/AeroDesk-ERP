import { Router } from 'express';
import {
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../controllers/supplier.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listSuppliers);
router.get('/:id', getSupplierById);
router.post('/', requireRole('STAFF', 'MANAGER', 'ADMIN'), createSupplier);
router.patch('/:id', requireRole('STAFF', 'MANAGER', 'ADMIN'), updateSupplier);
router.delete('/:id', requireRole('MANAGER', 'ADMIN'), deleteSupplier);

export default router;
