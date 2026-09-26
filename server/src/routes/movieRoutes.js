import { Router } from 'express';
import { search, show } from '../controllers/movieController.js';

const router = Router();

router.get('/search', search);
router.get('/:tmdbId', show);

export default router;
