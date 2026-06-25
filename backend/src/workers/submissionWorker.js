import amqp from "amqplib";
import { Submission } from "../models/Submission.js";
import { Problem } from "../models/Problem.js";
import { executeCode } from "../services/executeCode.js";
import { refreshUserContestStanding } from "../services/contestLeaderboardService.js";

export const startWorker = async () => {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    const queue = "submission_queue";

    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1);

    console.log(`[*] Worker listening for submissions...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const { submissionId } = JSON.parse(msg.content.toString());

        try {
          const submission = await Submission.findById(submissionId);

if (!submission) {
  return channel.ack(msg);
}

const problem = await Problem.findById(submission.problemId);

if (!problem) {
  return channel.ack(msg);
}

          submission.status = "Processing";
          await submission.save();

          const testCasesToRun = submission.action === 'run' 
            ? problem.testCases.filter(tc => !tc.isHidden) 
            : problem.testCases;

          const result = await executeCode(
            submission.code,
            submission.language,
            testCasesToRun,
            problem.timeLimitMs
          );

          submission.status = result.status;
          submission.executionTimeMs = result.executionTimeMs;
          submission.memoryUsedKb = result.memoryUsedKb;
          submission.outputLogs = result.outputLogs;
          await submission.save();

          if (
  submission.isContestSubmission &&
  submission.contestId &&
  submission.action === "submit"
) {
  await refreshUserContestStanding(submission.contestId, submission.userId);
}

          console.log(`[✔] Finalized Submission ${submissionId}: ${result.status}`);
          channel.ack(msg);
        } catch (err) {
          console.error("Worker process error:", err);
          try {
            await Submission.findByIdAndUpdate(submissionId, { 
              status: "Compilation Error", 
              outputLogs: err.message 
            });
          } catch (dbErr) {
            console.error("DB update failed:", dbErr);
          }
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    console.error("RabbitMQ Worker Error:", error);
  }
};