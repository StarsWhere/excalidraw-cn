"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");
const targets = [
  "dist",
  ".tmp-dev.stdout.log",
  ".tmp-dev.stderr.log",
  path.join(".husky", "_"),
];

const main = async () => {
  for (const target of targets) {
    await fs.rm(path.join(rootDir, target), { recursive: true, force: true });
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
