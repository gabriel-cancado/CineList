import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { list, check, add, remove } from '../controllers/watchlistController.js';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.get('/check/:tmdbId', check);
router.post('/:tmdbId', add);
router.delete('/:tmdbId', remove);

export default router;
