"use strict";

const electron = require("electron");
const path = require("node:path");
const registerRuntime = require("./runtime.cjs");

registerRuntime({
  app: electron.app,
  BrowserWindow: electron.BrowserWindow,
  dialog: electron.dialog,
  ipcMain: electron.ipcMain,
  shell: electron.shell,
  appRoot: path.resolve(__dirname, ".."),
});
