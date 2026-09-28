import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { list, mine, save } from '../controllers/reviewController.js';

const router = Router();

router.get('/:tmdbId/mine', requireAuth, mine);
router.get('/:tmdbId', list);
router.put('/:tmdbId', requireAuth, save);

export default router;