import { Express } from "express";
import fs from "fs/promises";
import path from "path";
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";

const ROOT_DIR = path.join(__dirname, "../..");
const BASE_SWAGGER = path.join(__dirname, "base.yaml");

async function findSwaggerFiles(
  dir: string,
  results: string[] = []
): Promise<string[]> {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      await findSwaggerFiles(fullPath, results);
    } else if (file === "swagger.yaml") {
      results.push(fullPath);
    }
  }

  return results;
}

async function loadSwaggerSpec() {
  const base = YAML.load(BASE_SWAGGER);

  base.paths ??= {};
  base.tags ??= [];
  base.components ??= {};
  base.components.schemas ??= {};
  base.components.securitySchemes ??= {};

  const swaggerFiles = await findSwaggerFiles(ROOT_DIR);
  const unwantedTags = ["default", "Default"];

  for (const file of swaggerFiles) {
    if (file === BASE_SWAGGER) continue;

    const doc = YAML.load(file);

    if (doc.paths) {
      Object.keys(doc.paths).forEach((pathKey) => {
        Object.keys(doc.paths[pathKey]).forEach((method) => {
          const operation = doc.paths[pathKey][method];
          if (operation.tags) {
            operation.tags = operation.tags.filter(
              (tag: string) => !unwantedTags.includes(tag)
            );
            if (operation.tags.length === 0) {
              delete operation.tags;
            }
          }
        });
      });

      Object.assign(base.paths, doc.paths);
    }

    if (doc.tags) {
      const existing = new Set(base.tags.map((t: { name: string }) => t.name));
      doc.tags.forEach((t: { name: string }) => {
        if (!unwantedTags.includes(t.name) && !existing.has(t.name)) {
          base.tags.push(t);
        }
      });
    }

    if (doc.components?.schemas) {
      Object.assign(base.components.schemas, doc.components.schemas);
    }
  }

  return base;
}

export async function registerSwagger(app: Express) {
  const swaggerSpec = await loadSwaggerSpec();

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  console.log("[Swagger] Docs available at /docs");
}
