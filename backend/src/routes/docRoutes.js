import express from 'express';
import {
  getDocuments,
  getDocumentById,
  uploadDocument,
  deleteDocument
} from '../controllers/docController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect); // All doc routes require authentication

router.route('/')
  .get(getDocuments);

router.post('/upload', upload.single('file'), uploadDocument);

router.route('/:id')
  .get(getDocumentById)
  .delete(deleteDocument);

import { getRelatedDocuments, summarizeDocument, executeAction } from '../controllers/docController.js';
router.get('/:id/related', getRelatedDocuments);
router.post('/:id/summarize', summarizeDocument);
router.post('/:id/action', executeAction);

export default router;
