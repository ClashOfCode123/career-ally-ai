import 'dotenv/config';
import express from 'express';
import { connectDB } from './src/config/db.js';
import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import { publishSubmission } from './src/queue/producer.js';
import { startWorker } from './src/workers/submissionWorker.js';
import { Submission } from './src/models/Submission.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const startServer = async () => {
  try {
    await connectDB();
    await connectRabbitMQ();

    // Start background processing
    startWorker();

    app.listen(PORT, () => {
      console.log(`🚀 Automata RCE Engine running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  }
};

app.post('/submit', async (req, res) => {
  try {
    const { userId, problemId, language, code } = req.body;

    const submission = await Submission.create({
      userId,
      problemId,
      language,
      code,
      status: 'Pending'
    });

    // Hand off to the queue
    await publishSubmission(submission._id);

    res.status(201).json({ 
        message: "Submission received and queued!", 
        submissionId: submission._id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

startServer();