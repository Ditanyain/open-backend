import fs from "fs";
import path from "path";
import { Express, Router } from "express";

const scanAndRegister = async (
  dir: string,
  routePrefix: string,
  app: Express
) => {
  const items = fs.readdirSync(dir);

  const hasRouteFile = items.find((item) => item.match(/^route\.(ts|js)$/));

  if (hasRouteFile) {
    try {
      const routePath = path.join(dir, hasRouteFile);
      const routeModule = await import(routePath);
      const router: Router = routeModule.default || routeModule.router;

      if (router && typeof router === "function") {
        app.use(routePrefix, router);
        console.log(`[Feature] Loaded: ${routePrefix}`);
      }
    } catch (err) {
      console.error(`[Feature] Error loading route at ${dir}:`, err);
    }
  }

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const nextRoutePrefix = `${routePrefix}/${item}`;
      await scanAndRegister(fullPath, nextRoutePrefix, app);
    }
  }
};

export const registerFeatures = async (app: Express) => {
  const featuresPath = path.join(__dirname, "../features");

  if (!fs.existsSync(featuresPath)) {
    console.warn("Features directory not found!");
    return;
  }

  await scanAndRegister(featuresPath, "/api", app);
};
