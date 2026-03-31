"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_CONTAINER_NAME = "default_canvas";
const FILE_TTL_MS = 24 * 60 * 60 * 1000;

const createDesktopStorage = ({ app }) => {
  const rootDir = path.join(app.getPath("userData"), "handraw");
  const stateDir = path.join(rootDir, "state");
  const scenesDir = path.join(rootDir, "scenes");
  const filesDir = path.join(rootDir, "files");
  const metaDir = path.join(rootDir, "meta");

  const appStateFile = path.join(stateDir, "app-state.json");
  const containersFile = path.join(stateDir, "containers.json");
  const libraryFile = path.join(stateDir, "library.json");
  const settingsFile = path.join(metaDir, "settings.json");
  let initialized = false;
  let initializationPromise = null;

  const sceneFilePath = (containerName) =>
    path.join(scenesDir, `${encodeURIComponent(containerName)}.excalidraw.json`);

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

  const writeJson = async (filePath, value) => {
    const tempFilePath = `${filePath}.${process.pid}.${Date.now()}.${Math.random()
      .toString(16)
      .slice(2)}.tmp`;
    await ensureDir(path.dirname(filePath));
    try {
      await fs.writeFile(tempFilePath, JSON.stringify(value, null, 2), "utf8");
      await fs.rename(tempFilePath, filePath);
    } finally {
      await fs.rm(tempFilePath, { force: true }).catch(() => undefined);
    }
  };

  const ensureInitialized = async () => {
    if (initialized) {
      return;
    }

    if (!initializationPromise) {
      initializationPromise = (async () => {
        await Promise.all([
          ensureDir(stateDir),
          ensureDir(scenesDir),
          ensureDir(filesDir),
          ensureDir(metaDir),
        ]);

        const containers = await readJson(containersFile, null);
        const nextContainers =
          Array.isArray(containers) && containers.length
            ? containers
            : [DEFAULT_CONTAINER_NAME];
        await writeJson(containersFile, nextContainers);

        const settings = await readJson(settingsFile, {});
        const currentContainerName =
          typeof settings.currentContainerName === "string" &&
          nextContainers.includes(settings.currentContainerName)
            ? settings.currentContainerName
            : nextContainers[0];
        await writeJson(settingsFile, {
          ...settings,
          currentContainerName,
        });

        if (!(await fileExists(appStateFile))) {
          await writeJson(appStateFile, {});
        }

        if (!(await fileExists(libraryFile))) {
          await writeJson(libraryFile, []);
        }

        for (const containerName of nextContainers) {
          const filePath = sceneFilePath(containerName);
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

  const readContainers = async () => {
    await ensureInitialized();
    const containers = await readJson(containersFile, [DEFAULT_CONTAINER_NAME]);
    return Array.isArray(containers) && containers.length
      ? containers
      : [DEFAULT_CONTAINER_NAME];
  };

  const readSettings = async () => {
    await ensureInitialized();
    const settings = await readJson(settingsFile, {});
    const containerList = await readContainers();
    const currentContainerName = containerList.includes(settings.currentContainerName)
      ? settings.currentContainerName
      : containerList[0];
    return {
      ...settings,
      currentContainerName,
    };
  };

  const writeSettings = async (partialSettings) => {
    const currentSettings = await readSettings();
    const nextSettings = {
      ...currentSettings,
      ...partialSettings,
    };
    await writeJson(settingsFile, nextSettings);
    return nextSettings;
  };

  const readScene = async (containerName) => {
    await ensureInitialized();
    return readJson(sceneFilePath(containerName), []);
  };

  const readAllScenes = async (containerList) => {
    const entries = await Promise.all(
      containerList.map(async (containerName) => [
        containerName,
        await readScene(containerName),
      ]),
    );
    return Object.fromEntries(entries);
  };

  const loadDesktopState = async () => {
    const containerList = await readContainers();
    const settings = await readSettings();
    const scenes = await readAllScenes(containerList);
    const appState = await readJson(appStateFile, {});
    const libraryItems = await readJson(libraryFile, []);

    return {
      containerList,
      containerName: settings.currentContainerName,
      appState,
      scenes,
      elements: scenes[settings.currentContainerName] || [],
      libraryItems,
      settings,
    };
  };

  const loadDraftState = async () => {
    const state = await loadDesktopState();
    return {
      containerList: state.containerList,
      containerName: state.containerName,
      appState: state.appState,
      elements: state.elements,
      scenes: state.scenes,
    };
  };

  const saveDraftState = async ({ containerName, elements, appState }) => {
    const containerList = await readContainers();
    const nextContainerList = containerList.includes(containerName)
      ? containerList
      : [...containerList, containerName];

    await writeJson(containersFile, nextContainerList);
    await writeSettings({ currentContainerName: containerName });
    await writeJson(sceneFilePath(containerName), elements || []);
    await writeJson(appStateFile, appState || {});

    return loadDraftState();
  };

  const writeContainer = async (payload) => {
    const { mode, name, previousName, elements } = payload;
    const containerList = await readContainers();
    const settings = await readSettings();

    if (mode === "create") {
      if (!containerList.includes(name)) {
        await writeJson(containersFile, [...containerList, name]);
        await writeJson(sceneFilePath(name), elements || []);
      }
      await writeSettings({ currentContainerName: name });
      return loadDraftState();
    }

    if (mode === "rename") {
      if (!previousName || previousName === name) {
        return loadDraftState();
      }

      const previousScenePath = sceneFilePath(previousName);
      const nextScenePath = sceneFilePath(name);
      const sceneElements = elements || (await readScene(previousName));

      await writeJson(nextScenePath, sceneElements);
      if (await fileExists(previousScenePath)) {
        await fs.rm(previousScenePath, { force: true });
      }

      const nextContainerList = containerList.map((containerName) =>
        containerName === previousName ? name : containerName,
      );
      await writeJson(containersFile, nextContainerList);
      await writeSettings({
        currentContainerName:
          settings.currentContainerName === previousName
            ? name
            : settings.currentContainerName,
      });
      return loadDraftState();
    }

    if (mode === "select") {
      await writeSettings({ currentContainerName: name });
      return loadDraftState();
    }

    if (mode === "updateScene") {
      await writeJson(sceneFilePath(name), elements || []);
      if (!containerList.includes(name)) {
        await writeJson(containersFile, [...containerList, name]);
      }
      return loadDraftState();
    }

    return loadDraftState();
  };

  const deleteContainer = async (name) => {
    const containerList = await readContainers();
    const nextContainerList = containerList.filter(
      (containerName) => containerName !== name,
    );
    const ensuredContainerList = nextContainerList.length
      ? nextContainerList
      : [DEFAULT_CONTAINER_NAME];

    if (!nextContainerList.length) {
      await writeJson(sceneFilePath(DEFAULT_CONTAINER_NAME), []);
    }

    await writeJson(containersFile, ensuredContainerList);
    await fs.rm(sceneFilePath(name), { force: true });

    const settings = await readSettings();
    if (!ensuredContainerList.includes(settings.currentContainerName)) {
      await writeSettings({
        currentContainerName: ensuredContainerList[0],
      });
    }

    return loadDraftState();
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

  const resetDesktopState = async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
    invalidateInitialization();
    await ensureInitialized();
    return loadDesktopState();
  };

  return {
    loadDesktopState,
    loadDraftState,
    saveDraftState,
    listContainers: readContainers,
    writeContainer,
    deleteContainer,
    loadLibraryState,
    saveLibraryState,
    readBinaryFileCache,
    writeBinaryFileCache,
    pruneBinaryFileCache,
    writeSettings,
    resetDesktopState,
  };
};

module.exports = createDesktopStorage;
