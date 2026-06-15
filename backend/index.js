
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import http from "http";
import { Server } from "socket.io";
import cookieParser from 'cookie-parser';
import { connectDB } from './src/config/db.js';
import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import { publishSubmission } from './src/queue/producer.js';
import { startWorker } from './src/workers/submissionWorker.js';
import { Submission } from './src/models/Submission.js';
import authRoutes from './src/routes/authRoutes.js';
import problemRoutes from './src/routes/problemRoutes.js';
import interviewRoutes from './src/routes/interviewRoutes.js';
import { startInterviewCleanupJob } from "./src/jobs/interviewCleanup.js";
import { protect } from "./src/middleware/authMiddleware.js";
import { Problem } from "./src/models/Problem.js";
import { Contest } from "./src/models/Contest.js";
import contestRoutes from "./src/routes/contestRoutes.js";
import { connectRedis, redisClient } from "./src/config/redis.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const roomDocuments = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", ({ roomId }) => {
    if (!roomId) return;

    socket.join(roomId);

    const currentDocument = roomDocuments.get(roomId) || "";
    socket.emit("init-document", currentDocument);

    const room = io.sockets.adapter.rooms.get(roomId);
    const userCount = room ? room.size : 1;

    io.to(roomId).emit("room-metrics", {
      roomId,
      userCount,
    });

    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("document-change", ({ roomId, text }) => {
    if (!roomId) return;

    roomDocuments.set(roomId, text || "");

    socket.to(roomId).emit("document-update", text || "");
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;

      setTimeout(() => {
        const room = io.sockets.adapter.rooms.get(roomId);
        const userCount = room ? room.size : 0;

        io.to(roomId).emit("room-metrics", {
          roomId,
          userCount,
        });
      }, 0);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});
 
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/interviews', interviewRoutes);
app.use("/api/contests", contestRoutes);

app.post("/api/submit", protect, async (req, res) => {
  try {
    const { problemId, language, code, action = "submit", contestId } = req.body;

    if (contestId && action === "submit" && redisClient.isOpen) {
      const rateKey = `ratelimit:contest-submit:${contestId}:${req.user._id}`;

      const count = await redisClient.incr(rateKey);

      if (count === 1) {
        await redisClient.expire(rateKey, 10);
      }

      if (count > 3) {
        return res.status(429).json({
          error:
            "Too many submissions. Please wait a few seconds before submitting again.",
        });
      }
    }

    if (!problemId || !language || !code) {
      return res.status(400).json({
        error: "problemId, language and code are required",
      });
    }

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    let isContestSubmission = false;

    if (contestId) {
      const contest = await Contest.findById(contestId);

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      const now = new Date();

      if (now < contest.startTime) {
        return res.status(403).json({
          error: "Contest has not started yet",
        });
      }

      if (now > contest.endTime) {
        return res.status(403).json({
          error: "Contest has ended",
        });
      }

      const joined = contest.participants.some(
        (id) => id.toString() === req.user._id.toString()
      );

      if (!joined) {
        return res.status(403).json({
          error: "Join the contest before submitting",
        });
      }

      const problemBelongsToContest = contest.problems.some(
        (p) => p.problem.toString() === problemId
      );

      if (!problemBelongsToContest) {
        return res.status(403).json({
          error: "Problem does not belong to this contest",
        });
      }

      isContestSubmission = true;
    }

    const submission = await Submission.create({
      userId: req.user._id,
      problemId,
      language,
      code,
      action,
      contestId: contestId || null,
      isContestSubmission,
      status: "Pending",
    });

    await publishSubmission(submission._id);

    res.status(201).json({
      message: "Submission queued",
      submissionId: submission._id,
    });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/status/:id", protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const isOwner = submission.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not allowed" });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/health', (req, res) => res.status(200).json({ status: "Engine running" }));

const startServer = async () => {
  try {
    await connectDB();

    await connectRedis();
    console.log("✅ Redis Connected");

    startInterviewCleanupJob();
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
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  }
};

startServer();