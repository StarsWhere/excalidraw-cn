"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");
const targets = [
  {
    sourceDir: path.join(rootDir, "src", "main"),
    outputDir: path.join(rootDir, "dist", "main"),
  },
  {
    sourceDir: path.join(rootDir, "src", "preload"),
    outputDir: path.join(rootDir, "dist", "preload"),
  },
];

const main = async () => {
  for (const { sourceDir, outputDir } of targets) {
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(path.dirname(outputDir), { recursive: true });
    await fs.cp(sourceDir, outputDir, { recursive: true });
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
