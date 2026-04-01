"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_BOARD_NAME = "default-board";
const FILE_TTL_MS = 24 * 60 * 60 * 1000;

const createDesktopStorage = ({ app }) => {
  const rootDir = path.join(app.getPath("userData"), "handraw-v2");
  const boardsDir = path.join(rootDir, "boards");
  const filesDir = path.join(rootDir, "files");

  const settingsFile = path.join(rootDir, "settings.json");
  const boardsFile = path.join(rootDir, "boards.json");
  const libraryFile = path.join(rootDir, "library.json");
  const writeQueues = new Map();
  let initialized = false;
  let initializationPromise = null;

  const boardFilePath = (boardId) =>
    path.join(boardsDir, `${encodeURIComponent(boardId)}.excalidraw.json`);

  const ensureDir = (dirPath) => fs.mkdir(dirPath, { recursive: true });

  const fileExists = async (filePath) => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  };

  const readJson = async (filePath, fallbackValue) => {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw);
    } catch {
      return fallbackValue;
    }
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const isRetryableWindowsWriteError = (error) =>
    Boolean(error) && ["EPERM", "EBUSY", "EACCES"].includes(error.code);

  const commitJsonFile = async (filePath, value) => {
    const tempFilePath = `${filePath}.${process.pid}.${Date.now()}.${Math.random()
      .toString(16)
      .slice(2)}.tmp`;
    const payload = JSON.stringify(value, null, 2);

    await ensureDir(path.dirname(filePath));
    try {
      await fs.writeFile(tempFilePath, payload, "utf8");

      let lastError = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          await fs.rename(tempFilePath, filePath);
          return;
        } catch (error) {
          lastError = error;
          if (!isRetryableWindowsWriteError(error) || attempt === 5) {
            break;
          }
          await delay(25 * 2 ** attempt);
        }
      }

      if (lastError) {
        try {
          await fs.copyFile(tempFilePath, filePath);
          return;
        } catch (copyError) {
          if (!isRetryableWindowsWriteError(copyError)) {
            throw copyError;
          }
        }
        throw lastError;
      }
    } finally {
      await fs.rm(tempFilePath, { force: true }).catch(() => undefined);
    }
  };

  const writeJson = async (filePath, value) => {
    const previousWrite = writeQueues.get(filePath) || Promise.resolve();
    const nextWrite = previousWrite
      .catch(() => undefined)
      .then(() => commitJsonFile(filePath, value));

    writeQueues.set(filePath, nextWrite);

    try {
      await nextWrite;
    } finally {
      if (writeQueues.get(filePath) === nextWrite) {
        writeQueues.delete(filePath);
      }
    }
  };

  const createBoardId = () =>
    `board-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const createDefaultBoard = () => ({
    id: createBoardId(),
    name: DEFAULT_BOARD_NAME,
  });

  const ensureInitialized = async () => {
    if (initialized) {
      return;
    }

    if (!initializationPromise) {
      initializationPromise = (async () => {
        await Promise.all([ensureDir(rootDir), ensureDir(boardsDir), ensureDir(filesDir)]);

        const rawBoards = await readJson(boardsFile, null);
        const nextBoards =
          Array.isArray(rawBoards) && rawBoards.length
            ? rawBoards.filter(
                (board) =>
                  board &&
                  typeof board.id === "string" &&
                  typeof board.name === "string",
              )
            : [createDefaultBoard()];

        if (!nextBoards.length) {
          nextBoards.push(createDefaultBoard());
        }
        await writeJson(boardsFile, nextBoards);

        const settings = await readJson(settingsFile, {});
        const currentBoardId = nextBoards.some(
          (board) => board.id === settings.currentBoardId,
        )
          ? settings.currentBoardId
          : nextBoards[0].id;
        await writeJson(settingsFile, {
          currentBoardId,
          appState:
            settings && typeof settings.appState === "object" ? settings.appState : {},
        });

        if (!(await fileExists(libraryFile))) {
          await writeJson(libraryFile, []);
        }

        for (const board of nextBoards) {
          const filePath = boardFilePath(board.id);
          if (!(await fileExists(filePath))) {
            await writeJson(filePath, []);
          }
        }

        initialized = true;
      })().finally(() => {
        initializationPromise = null;
      });
    }

    await initializationPromise;
  };

  const invalidateInitialization = () => {
    initialized = false;
  };

  const readBoards = async () => {
    await ensureInitialized();
    const boards = await readJson(boardsFile, []);
    return Array.isArray(boards) && boards.length ? boards : [createDefaultBoard()];
  };

  const readSettings = async () => {
    await ensureInitialized();
    const settings = await readJson(settingsFile, {});
    const boards = await readBoards();
    const currentBoardId = boards.some((board) => board.id === settings.currentBoardId)
      ? settings.currentBoardId
      : boards[0].id;

    return {
      currentBoardId,
      appState:
        settings && typeof settings.appState === "object" ? settings.appState : {},
    };
  };

  const findBoardByName = async (name) => {
    const boards = await readBoards();
    return boards.find((board) => board.name === name) || null;
  };

  const readBoardScene = async (boardId) => {
    await ensureInitialized();
    return readJson(boardFilePath(boardId), []);
  };

  const readAllScenes = async (boards) => {
    const entries = await Promise.all(
      boards.map(async (board) => [board.name, await readBoardScene(board.id)]),
    );
    return Object.fromEntries(entries);
  };

  const writeSettings = async (partialSettings) => {
    const currentSettings = await readSettings();
    const boards = await readBoards();
    const nextSettings = {
      ...currentSettings,
      ...partialSettings,
    };

    if (partialSettings.currentBoardName) {
      const matchingBoard = boards.find(
        (board) => board.name === partialSettings.currentBoardName,
      );
      nextSettings.currentBoardId = matchingBoard
        ? matchingBoard.id
        : currentSettings.currentBoardId;
    }

    delete nextSettings.currentBoardName;

    await writeJson(settingsFile, nextSettings);
    const currentBoard =
      boards.find((board) => board.id === nextSettings.currentBoardId) || boards[0];
    return {
      currentBoardName: currentBoard.name,
      appState: nextSettings.appState,
    };
  };

  const loadWorkspaceState = async () => {
    const boards = await readBoards();
    const settings = await readSettings();
    const currentBoard =
      boards.find((board) => board.id === settings.currentBoardId) || boards[0];
    const scenes = await readAllScenes(boards);
    const libraryItems = await readJson(libraryFile, []);

    return {
      boardList: boards.map((board) => board.name),
      boardName: currentBoard.name,
      appState: settings.appState || {},
      scenes,
      elements: scenes[currentBoard.name] || [],
      libraryItems,
      settings: {
        currentBoardName: currentBoard.name,
      },
    };
  };

  const saveWorkspaceState = async ({ boardName, elements, appState }) => {
    const boards = await readBoards();
    let targetBoard = boards.find((board) => board.name === boardName) || null;
    let nextBoards = boards;

    if (!targetBoard) {
      targetBoard = {
        id: createBoardId(),
        name: boardName,
      };
      nextBoards = [...boards, targetBoard];
      await writeJson(boardsFile, nextBoards);
    }

    await writeSettings({
      currentBoardId: targetBoard.id,
      appState: appState || {},
    });
    await writeJson(boardFilePath(targetBoard.id), elements || []);

    return loadWorkspaceState();
  };

  const listBoards = async () => {
    const boards = await readBoards();
    return boards.map((board) => board.name);
  };

  const writeBoard = async (payload) => {
    const { mode, name, previousName, elements } = payload;
    const boards = await readBoards();
    const settings = await readSettings();

    if (mode === "create") {
      const existingBoard = boards.find((board) => board.name === name);
      if (!existingBoard) {
        const newBoard = {
          id: createBoardId(),
          name,
        };
        await writeJson(boardsFile, [...boards, newBoard]);
        await writeJson(boardFilePath(newBoard.id), elements || []);
        await writeSettings({ currentBoardId: newBoard.id });
      } else {
        await writeSettings({ currentBoardId: existingBoard.id });
      }
      return loadWorkspaceState();
    }

    if (mode === "rename") {
      if (!previousName || previousName === name) {
        return loadWorkspaceState();
      }

      const targetBoard = boards.find((board) => board.name === previousName);
      if (!targetBoard) {
        return loadWorkspaceState();
      }

      const nextBoards = boards.map((board) =>
        board.id === targetBoard.id ? { ...board, name } : board,
      );
      await writeJson(boardsFile, nextBoards);
      if (elements) {
        await writeJson(boardFilePath(targetBoard.id), elements);
      }
      return loadWorkspaceState();
    }

    if (mode === "select") {
      const targetBoard = boards.find((board) => board.name === name);
      if (targetBoard) {
        await writeSettings({ currentBoardId: targetBoard.id });
      }
      return loadWorkspaceState();
    }

    if (mode === "updateScene") {
      let targetBoard = boards.find((board) => board.name === name) || null;

      if (!targetBoard) {
        targetBoard = {
          id: createBoardId(),
          name,
        };
        await writeJson(boardsFile, [...boards, targetBoard]);
      }

      await writeJson(boardFilePath(targetBoard.id), elements || []);
      await writeSettings({
        currentBoardId:
          settings.currentBoardId && boards.some((board) => board.id === settings.currentBoardId)
            ? settings.currentBoardId
            : targetBoard.id,
      });
      return loadWorkspaceState();
    }

    return loadWorkspaceState();
  };

  const deleteBoard = async (name) => {
    const boards = await readBoards();
    const targetBoard = boards.find((board) => board.name === name);
    if (!targetBoard) {
      return loadWorkspaceState();
    }

    let nextBoards = boards.filter((board) => board.id !== targetBoard.id);
    await fs.rm(boardFilePath(targetBoard.id), { force: true });

    if (!nextBoards.length) {
      const defaultBoard = createDefaultBoard();
      nextBoards = [defaultBoard];
      await writeJson(boardFilePath(defaultBoard.id), []);
    }

    await writeJson(boardsFile, nextBoards);

    const settings = await readSettings();
    if (!nextBoards.some((board) => board.id === settings.currentBoardId)) {
      await writeSettings({ currentBoardId: nextBoards[0].id });
    }

    return loadWorkspaceState();
  };

  const loadLibraryState = async () => {
    await ensureInitialized();
    return readJson(libraryFile, []);
  };

  const saveLibraryState = async (libraryItems) => {
    await writeJson(libraryFile, libraryItems || []);
    return libraryItems || [];
  };

  const fileCachePath = (fileId) => path.join(filesDir, `${fileId}.json`);

  const readBinaryFileCache = async (fileIds) => {
    const payloads = await Promise.all(
      fileIds.map(async (fileId) => {
        const fileData = await readJson(fileCachePath(fileId), null);
        return [fileId, fileData];
      }),
    );

    const loadedFiles = [];
    const erroredFiles = [];

    for (const [fileId, fileData] of payloads) {
      if (fileData) {
        loadedFiles.push({
          ...fileData,
          lastRetrieved: Date.now(),
        });
      } else {
        erroredFiles.push(fileId);
      }
    }

    await Promise.all(
      loadedFiles.map((fileData) => writeJson(fileCachePath(fileData.id), fileData)),
    );

    return {
      loadedFiles,
      erroredFiles,
    };
  };

  const writeBinaryFileCache = async (files) => {
    const savedFiles = [];
    const erroredFiles = [];

    await Promise.all(
      files.map(async (fileData) => {
        try {
          await writeJson(fileCachePath(fileData.id), fileData);
          savedFiles.push(fileData.id);
        } catch {
          erroredFiles.push(fileData.id);
        }
      }),
    );

    return {
      savedFiles,
      erroredFiles,
    };
  };

  const pruneBinaryFileCache = async (currentFileIds) => {
    await ensureInitialized();
    const entries = await fs.readdir(filesDir, { withFileTypes: true });
    const keep = new Set(currentFileIds);

    await Promise.all(
      entries.map(async (entry) => {
        if (!entry.isFile() || !entry.name.endsWith(".json")) {
          return;
        }

        const filePath = path.join(filesDir, entry.name);
        const fileData = await readJson(filePath, null);
        const fileId = fileData?.id || entry.name.replace(/\.json$/, "");
        const age = Date.now() - (fileData?.lastRetrieved || 0);
        if (!keep.has(fileId) && age > FILE_TTL_MS) {
          await fs.rm(filePath, { force: true });
        }
      }),
    );
  };

  const resetWorkspaceState = async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
    invalidateInitialization();
    await ensureInitialized();
    return loadWorkspaceState();
  };

  return {
    loadWorkspaceState,
    saveWorkspaceState,
    listBoards,
    writeBoard,
    deleteBoard,
    loadLibraryState,
    saveLibraryState,
    readBinaryFileCache,
    writeBinaryFileCache,
    pruneBinaryFileCache,
    writeSettings,
    resetWorkspaceState,
  };
};

module.exports = createDesktopStorage;
