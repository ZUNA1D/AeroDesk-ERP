import { Router } from 'express';
import { listUsers, createUser, updateUser, toggleUserStatus } from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Only ADMIN can manage users
router.use(requireAuth, requireRole('ADMIN'));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;
