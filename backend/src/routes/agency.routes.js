import { Router } from 'express';
import {
  getAgencyProfile,
  updateAgencyProfile,
  listAllAgencies,
  updateAgencyStatus
} from '../controllers/agency.controller.js';
import { requireAuth, requireRole, requireAgency } from '../middleware/auth.js';

const router = Router();

// Agency admin routes (scoped to own workspace)
router.get('/profile', requireAuth, requireAgency, getAgencyProfile);
router.put('/profile', requireAuth, requireAgency, requireRole('ADMIN'), updateAgencyProfile);

// Platform super-admin routes (platform management)
router.get('/all', requireAuth, requireRole('SUPER_ADMIN'), listAllAgencies);
router.patch('/:id/status', requireAuth, requireRole('SUPER_ADMIN'), updateAgencyStatus);

export default router;
