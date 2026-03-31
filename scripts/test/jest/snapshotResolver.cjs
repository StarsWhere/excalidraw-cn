"use strict";

const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const integrationRoot = path.join(rootDir, "src", "test", "integration");
const snapshotRoot = path.join(rootDir, "src", "test", "snapshots");

const isInside = (target, parent) => {
  const relative = path.relative(parent, target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
};

exports.resolveSnapshotPath = (testPath, snapshotExtension) => {
  if (isInside(testPath, integrationRoot)) {
    const relative = path.relative(integrationRoot, testPath);
    const dirname = path.dirname(relative);
    const basename = path.basename(relative) + snapshotExtension;
    return dirname === "."
      ? path.join(snapshotRoot, basename)
      : path.join(snapshotRoot, dirname, basename);
  }

  return path.join(
    path.dirname(testPath),
    "__snapshots__",
    path.basename(testPath) + snapshotExtension,
  );
};

exports.resolveTestPath = (snapshotPath, snapshotExtension) => {
  if (isInside(snapshotPath, snapshotRoot)) {
    const relative = path.relative(snapshotRoot, snapshotPath);
    const dirname = path.dirname(relative);
    const basename = path.basename(relative, snapshotExtension);
    return dirname === "."
      ? path.join(integrationRoot, basename)
      : path.join(integrationRoot, dirname, basename);
  }

  return path.join(
    path.dirname(path.dirname(snapshotPath)),
    path.basename(snapshotPath, snapshotExtension),
  );
};

exports.testPathForConsistencyCheck = path.join(
  integrationRoot,
  "selection.test.tsx",
);
