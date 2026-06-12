import express from 'express';
import {
  bookInterview,
  getInterviewRoom,
  getInterviewNotifications,
  markInterviewNotificationsRead,
} from '../controllers/interviewController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/interviews/book
router.post('/book', protect, bookInterview);

// GET /api/interviews/room/:roomId
router.get('/room/:roomId', protect, getInterviewRoom);

// GET /api/interviews/notifications
router.get('/notifications', protect, getInterviewNotifications);

// PATCH /api/interviews/notifications/read
router.patch('/notifications/read', protect, markInterviewNotificationsRead);

export default router;