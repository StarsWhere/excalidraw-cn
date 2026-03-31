"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const createDesktopStorage = require("./storage.cjs");

const DESKTOP_OPEN_FILE_CHANNEL = "handraw:open-file-event";
const SUPPORTED_OPEN_EXTENSIONS = new Set([
  ".excalidraw",
  ".excalidrawlib",
  ".png",
  ".svg",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".ico",
]);

const MIME_TYPES = {
  excalidraw: "application/vnd.excalidraw+json",
  excalidrawlib: "application/vnd.excalidrawlib+json",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  ico: "image/x-icon",
};

module.exports = ({ app, BrowserWindow, dialog, ipcMain, shell, appRoot }) => {
  let mainWindow = null;
  let pendingOpenPath = null;
  const desktopStorage = createDesktopStorage({ app });
  const isPackagedDistRoot = path.basename(appRoot) === "dist";
  const rendererRoot = isPackagedDistRoot
    ? path.join(appRoot, "renderer")
    : path.join(appRoot, "dist", "renderer");

  const isDevelopment = () => Boolean(process.env.ELECTRON_START_URL);

  const normalizeCandidatePath = (value) => {
    if (!value) {
      return null;
    }

    const normalized = path.resolve(value);
    const ext = path.extname(normalized).toLowerCase();

    if (!SUPPORTED_OPEN_EXTENSIONS.has(ext)) {
      return null;
    }

    return normalized;
  };

  const getFilePathFromArgv = (argv) => {
    for (const value of argv.slice(1)) {
      if (!value || value.startsWith("--")) {
        continue;
      }

      const candidate = normalizeCandidatePath(value);
      if (candidate) {
        return candidate;
      }
    }

    return null;
  };

  const getMimeTypeForPath = (filePath) => {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    return MIME_TYPES[ext] || "";
  };

  const readDesktopFilePayload = async (filePath) => {
    const normalizedPath = path.resolve(filePath);
    const buffer = await fs.readFile(normalizedPath);

    return {
      name: path.basename(normalizedPath),
      path: normalizedPath,
      type: getMimeTypeForPath(normalizedPath),
      buffer,
    };
  };

  const sendOpenFileToRenderer = (filePath) => {
    const normalizedPath = normalizeCandidatePath(filePath);
    if (!normalizedPath) {
      return;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.webContents.isLoadingMainFrame()) {
        pendingOpenPath = normalizedPath;
        return;
      }

      mainWindow.webContents.send(DESKTOP_OPEN_FILE_CHANNEL, normalizedPath);
      return;
    }

    pendingOpenPath = normalizedPath;
  };

  const getDialogFilters = (kind) => {
    switch (kind) {
      case "image":
        return [
          {
            name: "Images",
            extensions: [
              "png",
              "jpg",
              "jpeg",
              "svg",
              "gif",
              "webp",
              "bmp",
              "ico",
            ],
          },
        ];
      case "library":
        return [
          {
            name: "Handraw libraries",
            extensions: ["excalidrawlib"],
          },
        ];
      case "scene":
      default:
        return [
          {
            name: "Handraw files",
            extensions: ["excalidraw", "json", "png", "svg"],
          },
        ];
    }
  };

  const isSafeInternalUrl = (targetUrl) => {
    try {
      const parsed = new URL(targetUrl);

      if (isDevelopment()) {
        return parsed.origin === new URL(process.env.ELECTRON_START_URL).origin;
      }

      return parsed.protocol === "file:";
    } catch {
      return false;
    }
  };

  const createMainWindow = async () => {
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 960,
      minWidth: 1024,
      minHeight: 720,
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        preload: path.join(appRoot, "electron", "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webSecurity: true,
      },
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (!isSafeInternalUrl(url)) {
        shell.openExternal(url);
        return { action: "deny" };
      }

      return { action: "allow" };
    });

    mainWindow.webContents.on("will-navigate", (event, url) => {
      if (!isSafeInternalUrl(url)) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });

    mainWindow.once("ready-to-show", () => {
      mainWindow?.show();
    });

    if (isDevelopment()) {
      await mainWindow.loadURL(process.env.ELECTRON_START_URL);
    } else {
      await mainWindow.loadURL(pathToFileURL(path.join(rendererRoot, "index.html")).toString());
    }

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  };

  if (!app.requestSingleInstanceLock()) {
    app.quit();
  } else {
    app.on("second-instance", (_event, argv) => {
      const filePath = getFilePathFromArgv(argv);
      if (filePath) {
        sendOpenFileToRenderer(filePath);
      }

      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.focus();
      }
    });

    app.whenReady().then(async () => {
      pendingOpenPath = getFilePathFromArgv(process.argv);
      await createMainWindow();
    });
  }

  ipcMain.handle("handraw:open-file", async (_event, options = {}) => {
    const { kind = "scene", multiple = false } = options;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: multiple ? ["openFile", "multiSelections"] : ["openFile"],
      filters: getDialogFilters(kind),
    });

    if (result.canceled || !result.filePaths.length) {
      return null;
    }

    const payloads = await Promise.all(
      result.filePaths.map((filePath) => readDesktopFilePayload(filePath)),
    );

    return multiple ? payloads : payloads[0];
  });

  ipcMain.handle("handraw:read-file", async (_event, filePath) => {
    if (!filePath) {
      return null;
    }

    return readDesktopFilePayload(filePath);
  });

  ipcMain.handle("handraw:get-pending-open-file", async () => {
    if (!pendingOpenPath) {
      return null;
    }

    const nextPath = pendingOpenPath;
    pendingOpenPath = null;
    return readDesktopFilePayload(nextPath);
  });

  ipcMain.handle("handraw:save-file", async (_event, payload) => {
    const { buffer, suggestedName, filters, existingPath } = payload;

    let targetPath = existingPath || null;
    if (!targetPath) {
      const saveResult = await dialog.showSaveDialog(mainWindow, {
        defaultPath: suggestedName,
        filters,
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return null;
      }

      targetPath = saveResult.filePath;
    }

    await fs.writeFile(targetPath, Buffer.from(buffer));

    return {
      kind: "native",
      path: targetPath,
      name: path.basename(targetPath),
    };
  });

  ipcMain.handle("handraw:open-external", async (_event, url) => {
    if (!url) {
      return;
    }

    await shell.openExternal(url);
  });

  ipcMain.handle("handraw:load-desktop-state", async () => {
    return desktopStorage.loadDesktopState();
  });

  ipcMain.handle("handraw:load-draft-state", async () => {
    return desktopStorage.loadDraftState();
  });

  ipcMain.handle("handraw:save-draft-state", async (_event, payload) => {
    return desktopStorage.saveDraftState(payload || {});
  });

  ipcMain.handle("handraw:load-library-state", async () => {
    return desktopStorage.loadLibraryState();
  });

  ipcMain.handle("handraw:save-library-state", async (_event, items) => {
    return desktopStorage.saveLibraryState(items || []);
  });

  ipcMain.handle("handraw:list-containers", async () => {
    return desktopStorage.listContainers();
  });

  ipcMain.handle("handraw:write-container", async (_event, payload) => {
    return desktopStorage.writeContainer(payload || {});
  });

  ipcMain.handle("handraw:delete-container", async (_event, name) => {
    return desktopStorage.deleteContainer(name);
  });

  ipcMain.handle("handraw:read-binary-file-cache", async (_event, fileIds) => {
    return desktopStorage.readBinaryFileCache(fileIds || []);
  });

  ipcMain.handle("handraw:write-binary-file-cache", async (_event, files) => {
    return desktopStorage.writeBinaryFileCache(files || []);
  });

  ipcMain.handle("handraw:prune-binary-file-cache", async (_event, fileIds) => {
    await desktopStorage.pruneBinaryFileCache(fileIds || []);
  });

  ipcMain.handle("handraw:save-settings", async (_event, settings) => {
    return desktopStorage.writeSettings(settings || {});
  });

  ipcMain.handle("handraw:reset-desktop-state", async () => {
    return desktopStorage.resetDesktopState();
  });

  app.on("window-all-closed", () => {
    app.quit();
  });

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
};
