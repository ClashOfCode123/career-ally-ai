import amqp from "amqplib";

let channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
    await channel.assertQueue("submission_queue", { durable: true });
    console.log("✔ RabbitMQ Connected");
  } catch (error) {
    console.error("RabbitMQ Connection Error:", error);
    throw error;
  }
};

export const getChannel = () => channel;