"use strict";

const { spawn } = require("node:child_process");
const path = require("node:path");
const electronBinary = require("electron");
const waitOn = require("wait-on");

let electronProcess = null;
const workspaceRoot = path.resolve(__dirname, "..");

const terminateChild = () => {
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill();
  }
};

process.on("SIGINT", () => {
  terminateChild();
  process.exit(0);
});

process.on("SIGTERM", () => {
  terminateChild();
  process.exit(0);
});

waitOn({ resources: ["http-get://127.0.0.1:3000"] })
  .then(() => {
    const childEnv = {
      ...process.env,
      ELECTRON_START_URL: "http://localhost:3000",
    };
    delete childEnv.ELECTRON_RUN_AS_NODE;

    electronProcess = spawn(electronBinary, ["."], {
      stdio: "inherit",
      cwd: workspaceRoot,
      env: childEnv,
    });

    electronProcess.on("close", (code) => {
      process.exit(code ?? 0);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
