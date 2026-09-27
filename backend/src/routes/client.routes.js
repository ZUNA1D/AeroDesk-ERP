import { Router } from 'express';
import {
  listClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  uploadClientDocument
} from '../controllers/client.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth);

router.get('/', listClients);
router.get('/:id', getClientById);
router.post('/', requireRole('STAFF', 'MANAGER', 'ADMIN'), createClient);
router.patch('/:id', requireRole('STAFF', 'MANAGER', 'ADMIN'), updateClient);
router.delete('/:id', requireRole('MANAGER', 'ADMIN'), deleteClient);
router.post('/:id/documents', requireRole('STAFF', 'MANAGER', 'ADMIN'), upload.single('document'), uploadClientDocument);

export default router;
