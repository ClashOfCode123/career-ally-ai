import amqp from "amqplib";
import { Submission } from "../models/Submission.js";
import { Problem } from "../models/Problem.js";
import { executeCode } from "../services/executeCode.js";

export const startWorker = async () => {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    const queue = "submission_queue";

    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1); // Process one at a time

    console.log(`[*] Worker listening for submissions...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const { submissionId } = JSON.parse(msg.content.toString());

        try {
          const submission = await Submission.findById(submissionId);
          const problem = await Problem.findById(submission.problemId);

          if (!submission || !problem) {
            return channel.ack(msg);
          }

          // Update status to Processing
          submission.status = "Processing";
          await submission.save();

          // Call the service (The logic your peer is writing)
          const result = await executeCode(
            submission.code,
            submission.language,
            problem.testCases,
            problem.timeLimitMs
          );

          // Save final results
          submission.status = result.status;
          submission.executionTimeMs = result.executionTimeMs;
          submission.memoryUsedKb = result.memoryUsedKb;
          submission.outputLogs = result.outputLogs;
          await submission.save();

          console.log(`[✔] Finalized Submission ${submissionId}: ${result.status}`);
          channel.ack(msg);
        } catch (err) {
          console.error("Worker process error:", err);
        }
      }
    });
  } catch (error) {
    console.error("RabbitMQ Worker Error:", error);
  }
};