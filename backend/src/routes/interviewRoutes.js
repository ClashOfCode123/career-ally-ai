import express from 'express';
import { bookInterview, getInterviewRoom } from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js'; // Adjust the import name based on your exact middleware export

const router = express.Router();

// POST /api/interviews/book
router.post('/book', protect, bookInterview);

// GET /api/interviews/room/:roomId
router.get('/room/:roomId', protect, getInterviewRoom);

export default router;