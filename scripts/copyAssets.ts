import fs from "fs";
import path from "path";

const srcFeatureDir = path.join(__dirname, "../src/features");
const distFeatureDir = path.join(__dirname, "../dist/features");

const srcGeoDir = path.join(__dirname, "../src/config/GeoLiteDB");
const distGeoDir = path.join(__dirname, "../dist/config/GeoLiteDB");

const srcDocsDir = path.join(__dirname, "../src/docs");
const distDocsDir = path.join(__dirname, "../dist/docs");

const copyYamlFiles = (source: string, target: string) => {
  if (!fs.existsSync(source)) return;

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  files.forEach((file) => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    const stat = fs.lstatSync(sourcePath);

    if (stat.isDirectory()) {
      copyYamlFiles(sourcePath, targetPath);
    } else if (file.endsWith(".yaml") || file.endsWith(".yml")) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`[YAML] Copied: ${sourcePath} -> ${targetPath}`);
    }
  });
};

const copyDirRecursive = (source: string, target: string) => {
  if (!fs.existsSync(source)) {
    console.warn(`Source not found: ${source}`);
    return;
  }

  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);

  files.forEach((file) => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    const stat = fs.lstatSync(sourcePath);

    if (stat.isDirectory()) {
      copyDirRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`[Asset] Copied: ${sourcePath} -> ${targetPath}`);
    }
  });
};

try {
  console.log("Starting asset copy process...");

  copyYamlFiles(srcFeatureDir, distFeatureDir);

  copyYamlFiles(srcDocsDir, distDocsDir);

  copyDirRecursive(srcGeoDir, distGeoDir);

  console.log("All assets copied successfully!");
} catch (err) {
  console.error("Error copying files:", err);
  process.exit(1);
}
