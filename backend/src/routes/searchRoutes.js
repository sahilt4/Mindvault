import express from 'express';
import { searchKnowledge, getDashboardStats } from '../controllers/searchController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', searchKnowledge);
router.get('/dashboard-stats', getDashboardStats);

export default router;
