import amqp from "amqplib";

let channel;
const RABBITMQ_URL = "amqp://guest:guest@localhost:5672";

export const connectRabbitMQ = async (retries = 5) => {
  while (retries > 0) {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue("submission_queue", { durable: true });
      console.log("✔ RabbitMQ Connected");
      return;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error("RabbitMQ Connection Error:", error);
        throw error;
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

export const getChannel = () => {
  if (!channel) throw new Error("RabbitMQ channel not initialized.");
  return channel;
};