import express from 'express';
import multer from 'multer';
import { uploadAndMatch } from '../controllers/jobController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'), false);
    }
  }
});

router.post('/upload', protect, upload.single('resume'), uploadAndMatch);

export default router;