import { Router } from 'express';
import { getSetupStatus, setupInitialAdmin, registerAgency, login, logout, getMe } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Please try again after 15 minutes.'
});

const registerLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many registration attempts from this IP. Please try again after an hour.'
});

router.get('/status', getSetupStatus);
router.post('/setup', setupInitialAdmin);
router.post('/register', registerLimiter, registerAgency);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;

