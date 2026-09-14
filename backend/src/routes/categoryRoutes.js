import express from 'express';
import { getAllCategories, getCategoryContents } from '../controllers/categoryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All category routes require authentication

router.get('/', getAllCategories);
router.get('/:category', getCategoryContents);

export default router;
