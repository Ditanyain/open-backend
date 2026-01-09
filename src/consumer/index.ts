import fs from "fs";
import path from "path";
import { connect, Channel } from "amqplib";
import { queueConfig } from "@/config/queue.config";

export const queueName = (() => {
  let defaultQueueName: string | null = null;

  return async (name?: string): Promise<string | void> => {
    if (name) {
      defaultQueueName = name;
      return;
    }
    if (!defaultQueueName) throw new Error("Queue name not initialized");
    return defaultQueueName;
  };
})();

const scanAndRegisterListeners = async (
  dir: string,
  baseFeaturePath: string
) => {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await scanAndRegisterListeners(fullPath, baseFeaturePath);
    } else if (item === "listener.ts" || item === "listener.js") {
      try {
        const listenerModule = await import(fullPath);
        const listener = listenerModule.default;

        if (typeof listener === "function") {
          const connection = await connect(queueConfig.url);
          const channel: Channel = await connection.createChannel();

          const relativePath = path.relative(
            baseFeaturePath,
            path.dirname(fullPath)
          );
          const qName = relativePath.split(path.sep).join("_").toLowerCase();

          await channel.assertQueue(qName, { durable: true });
          await listener(channel, qName);

          await queueName(qName);

          console.log(
            `[Consumer] Listener registered: ${relativePath} (queue: ${qName})`
          );
        } else {
          console.warn(
            `[Consumer] Default export is not a function: ${fullPath}`
          );
        }
      } catch (err) {
        console.error(
          `[Consumer] Failed to load listener at ${fullPath}:`,
          err
        );
      }
    }
  }
};

export const registerFeaturesAndConsumers = async () => {
  const featuresPath = path.join(__dirname, "..", "features");

  if (!fs.existsSync(featuresPath)) {
    console.warn("[Consumer] Features directory not found!");
    return;
  }
  await scanAndRegisterListeners(featuresPath, featuresPath);
  console.log("[Consumer] All listeners registered successfully");
};
