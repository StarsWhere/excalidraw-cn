"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");
const sourceDir = path.join(rootDir, "desktop");
const outputDir = path.join(rootDir, "dist", "desktop");

const main = async () => {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(outputDir), { recursive: true });
  await fs.cp(sourceDir, outputDir, { recursive: true });
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
