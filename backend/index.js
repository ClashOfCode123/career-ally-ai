import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import cors from "cors";
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import { connectDB } from "./src/config/db.js";
import { connectRabbitMQ } from "./src/config/rabbitmq.js";
import { startWorker } from "./src/workers/submissionWorker.js";
import { startInterviewCleanupJob } from "./src/jobs/interviewCleanup.js";

import authRoutes from "./src/routes/authRoutes.js";
import problemRoutes from "./src/routes/problemRoutes.js";
import interviewRoutes from "./src/routes/interviewRoutes.js";
import submissionRoutes from "./src/routes/submissionRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const roomDocuments = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join-room", ({ roomId }) => {
    if (!roomId) return;

    socket.join(roomId);

    const currentDocument = roomDocuments.get(roomId) || "";
    socket.emit("init-document", currentDocument);

    const userCount = io.sockets.adapter.rooms.get(roomId)?.size || 1;

    io.to(roomId).emit("room-metrics", {
      userCount,
    });

    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("document-change", ({ roomId, text }) => {
    if (!roomId) return;

    roomDocuments.set(roomId, text);

    socket.to(roomId).emit("document-update", text);
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;

      setTimeout(() => {
        const userCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;

        io.to(roomId).emit("room-metrics", {
          userCount,
        });
      }, 100);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/submissions", submissionRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Engine running" });
});

const startServer = async () => {
  try {
    await connectDB();

    startInterviewCleanupJob();

    let retries = 5;

    while (retries > 0) {
      try {
        await connectRabbitMQ();
        console.log("✅ RabbitMQ Connected");
        break;
      } catch (err) {
        retries -= 1;
        console.log(`RabbitMQ retry left: ${retries}`);

        await new Promise((res) => setTimeout(res, 3000));

        if (retries === 0) throw err;
      }
    }

    await startWorker();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Initialization failed:", error);
    process.exit(1);
  }
};

startServer();