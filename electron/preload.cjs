"use strict";

const { contextBridge, ipcRenderer } = require("electron");

const OPEN_FILE_EVENT = "handraw:open-file-event";

contextBridge.exposeInMainWorld("handrawDesktop", {
  isElectron: true,
  platform: process.platform,
  openFile: (options) => ipcRenderer.invoke("handraw:open-file", options),
  saveFile: (payload) => ipcRenderer.invoke("handraw:save-file", payload),
  readFile: (filePath) => ipcRenderer.invoke("handraw:read-file", filePath),
  getPendingOpenFile: () => ipcRenderer.invoke("handraw:get-pending-open-file"),
  onOpenFile: (listener) => {
    const wrappedListener = async (_event, filePath) => {
      const payload = await ipcRenderer.invoke("handraw:read-file", filePath);
      if (payload) {
        listener(payload);
      }
    };

    ipcRenderer.on(OPEN_FILE_EVENT, wrappedListener);

    return () => {
      ipcRenderer.removeListener(OPEN_FILE_EVENT, wrappedListener);
    };
  },
  openExternal: (url) => ipcRenderer.invoke("handraw:open-external", url),
});
