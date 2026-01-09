import amqp from "amqplib";
import { queueConfig } from "../../config/queue.config";
import { queueName } from "@/consumer";

const sendMessage = async (message: string) => {
  const queue = (await queueName()) as string;
  const connection = await amqp.connect(queueConfig.url);
  const channel = await connection.createChannel();

  await channel.assertQueue(queue, {
    durable: true,
  });

  await channel.sendToQueue(queue, Buffer.from(message));

  setTimeout(() => {
    connection.close();
  }, 1000);
};

export { sendMessage };
