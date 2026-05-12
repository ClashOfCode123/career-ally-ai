import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { connectDB } from './src/config/db.js';
import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import { publishSubmission } from './src/queue/producer.js';
import { startWorker } from './src/workers/submissionWorker.js';
import { Submission } from './src/models/Submission.js';

// Auth Imports
import authRoutes from './src/routes/authRoutes.js';
import { protect } from './src/middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser()); // Necessary to read JWT from cookies

/**
 * ROUTES
 */

// 1. Authentication Routes (Register, Login, Logout)
app.use('/api/auth', authRoutes);

// 2. Protected Submission Route
// The 'protect' middleware ensures only logged-in users can submit
app.post('/submit', protect, async (req, res) => {
  try {
    const { problemId, language, code } = req.body;
    
    // req.user is populated by the 'protect' middleware after verifying the JWT
    const userId = req.user._id; 

    const submission = await Submission.create({
      userId,
      problemId,
      language,
      code,
      status: 'Pending'
    });

    // Hand off the submission ID to the RabbitMQ queue
    await publishSubmission(submission._id);

    res.status(201).json({ 
        message: "Submission received and queued!", 
        submissionId: submission._id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: "Engine is running 🚀" });
});

/**
 * SERVER INITIALIZATION
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to RabbitMQ
    await connectRabbitMQ();

    // Start the background Worker to listen for submissions
    startWorker();

    app.listen(PORT, () => {
      console.log(`🚀 Automata RCE Engine running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  }
};

startServer();