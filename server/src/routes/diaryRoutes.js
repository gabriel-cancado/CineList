import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { list, checkMovie, add, remove } from '../controllers/diaryController.js';

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.get('/check/:tmdbId', checkMovie);
router.post('/:tmdbId', add);
router.delete('/:id', remove);

export default router;
