import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  sendResumeChatMessage,
  getResumeChatHistory,
  resetResumeChat
} from '../controllers/resumeChatController.js';

const router = express.Router();

router.post('/message', protect, sendResumeChatMessage);
router.get('/history', protect, getResumeChatHistory);
router.delete('/reset', protect, resetResumeChat);

export default router;