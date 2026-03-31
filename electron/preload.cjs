"use strict";

const { contextBridge, ipcRenderer } = require("electron");

const OPEN_FILE_EVENT = "handraw:open-file-event";

contextBridge.exposeInMainWorld("handrawDesktop", {
  isElectron: true,
  platform: process.platform,
  loadDesktopState: () => ipcRenderer.invoke("handraw:load-desktop-state"),
  saveDesktopState: (payload) =>
    ipcRenderer.invoke("handraw:save-desktop-state", payload),
  loadLibraryState: () => ipcRenderer.invoke("handraw:load-library-state"),
  saveLibraryState: (items) => ipcRenderer.invoke("handraw:save-library-state", items),
  listBoards: () => ipcRenderer.invoke("handraw:list-boards"),
  writeBoard: (payload) => ipcRenderer.invoke("handraw:write-board", payload),
  deleteBoard: (name) => ipcRenderer.invoke("handraw:delete-board", name),
  readBinaryFileCache: (fileIds) =>
    ipcRenderer.invoke("handraw:read-binary-file-cache", fileIds),
  writeBinaryFileCache: (files) =>
    ipcRenderer.invoke("handraw:write-binary-file-cache", files),
  pruneBinaryFileCache: (fileIds) =>
    ipcRenderer.invoke("handraw:prune-binary-file-cache", fileIds),
  saveSettings: (settings) => ipcRenderer.invoke("handraw:save-settings", settings),
  resetDesktopState: () => ipcRenderer.invoke("handraw:reset-desktop-state"),
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
