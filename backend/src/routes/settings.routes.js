import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Settings are readable by anyone authenticated (or needed for branding on login/shell)
router.get('/', getSettings);
router.patch('/', requireAuth, requireRole('ADMIN'), upload.single('logo'), updateSettings);

export default router;
