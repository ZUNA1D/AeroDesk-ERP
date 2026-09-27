import { Router } from 'express';
import { getSetupStatus, setupInitialAdmin, login, logout, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/status', getSetupStatus);
router.post('/setup', setupInitialAdmin);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
