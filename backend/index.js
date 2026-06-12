import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { connectDB } from './src/config/db.js';
import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import { publishSubmission } from './src/queue/producer.js';
import { startWorker } from './src/workers/submissionWorker.js';
import { Submission } from './src/models/Submission.js';
import authRoutes from './src/routes/authRoutes.js';
import problemRoutes from './src/routes/problemRoutes.js';
import interviewRoutes from './src/routes/interviewRoutes.js';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/interviews', interviewRoutes);
app.post('/api/submit', async (req, res) => {
  try {
    const { problemId, language, code, userId } = req.body; 
    
    const submission = await Submission.create({
      userId: userId || "65ab1c2d3e4f5a6b7c8d9e0f",
      problemId,
      language,
      code,
      status: 'Pending'
    });
    
    await publishSubmission(submission._id);
    res.status(201).json({ message: "Submission queued", submissionId: submission._id });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/health', (req, res) => res.status(200).json({ status: "Engine running" }));

const startServer = async () => {
  try {
    await connectDB();
    
    let retries = 5;
    while (retries > 0) {
      try {
        await connectRabbitMQ();
        console.log("✅ RabbitMQ Connected");
        break;
      } catch (err) {
        retries -= 1;
        await new Promise(res => setTimeout(res, 3000));
        if (retries === 0) throw err;
      }
    }

    startWorker();
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  }
};

startServer();