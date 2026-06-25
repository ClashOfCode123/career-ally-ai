import { getChannel } from "../config/rabbitmq.js";

export const publishSubmission = async (submissionId) => {
  const channel = getChannel();
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  const message = JSON.stringify({ submissionId });
  
  channel.sendToQueue("submission_queue", Buffer.from(message), {
    persistent: true,
  });

  console.log(`[+] Queued Submission: ${submissionId}`);
};