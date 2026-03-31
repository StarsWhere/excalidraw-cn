"use strict";

const electron = require("electron");
const path = require("node:path");
const registerRuntime = require("./runtime.cjs");

registerRuntime({
  ...electron,
  appRoot: path.resolve(__dirname, ".."),
});
