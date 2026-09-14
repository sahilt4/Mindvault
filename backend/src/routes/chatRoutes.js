import express from 'express';
import {
  getChats,
  getChatById,
  sendMessage,
  deleteChat
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All chat routes require authentication

router.route('/')
  .get(getChats)
  .post(sendMessage);

router.route('/:id')
  .get(getChatById)
  .delete(deleteChat);

export default router;
