import path from "path";

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { appConfig } from "./config/app.config";
import { errorHandler } from "./core/middlewares/errorHandler.middleware";

import { registerFeatures } from "./routes";
import { registerFeaturesAndConsumers } from "./consumer";
import { initIpLocation } from "./shared/utils/ip";
import { registerSwagger } from "./docs/swagger";

const init = async () => {
  const app = express();

  app.use(cors(appConfig.cors));
  app.use(express.json());

  await initIpLocation(
    path.join(__dirname, "config/GeoLiteDB/GeoLite2-City.mmdb")
  );

  await registerFeatures(app);
  await registerFeaturesAndConsumers();
  await registerSwagger(app);

  app.use(errorHandler);

  app.listen(appConfig.port, appConfig.host, () => {
    console.log(
      `[Server] Server running at http://${appConfig.host}:${appConfig.port}`
    );
  });
};

init();
