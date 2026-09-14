import express from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All note routes require authentication

router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .get(getNoteById)
  .put(updateNote)
  .delete(deleteNote);

import { getRelatedNotes, summarizeNote, executeAction } from '../controllers/noteController.js';
router.get('/:id/related', getRelatedNotes);
router.post('/:id/summarize', summarizeNote);
router.post('/:id/action', executeAction);

export default router;
