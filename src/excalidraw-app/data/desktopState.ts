import { ExcalidrawElement, FileId } from "../../element/types";
import { AppState, BinaryFileData } from "../../types";
import {
  clearAppStateForLocalStorage,
  getDefaultAppState,
} from "../../appState";
import { clearElementsForLocalStorage } from "../../element";
import { STORAGE_KEYS } from "../app_constants";
import { ImportedDataState } from "../../data/types";

export type DesktopSettings = {
  currentContainerName: string;
};

export type DesktopDraftState = {
  containerList: string[];
  containerName: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState> | null;
  scenes: Record<string, readonly ExcalidrawElement[]>;
};

export type DesktopBootstrapState = DesktopDraftState & {
  libraryItems: ImportedDataState["libraryItems"];
  settings?: DesktopSettings;
};

export type DesktopDraftSavePayload = {
  containerName: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
};

export type DesktopContainerWritePayload =
  | {
      mode: "create" | "select";
      name: string;
      elements?: readonly ExcalidrawElement[];
    }
  | {
      mode: "rename";
      name: string;
      previousName: string;
      elements?: readonly ExcalidrawElement[];
    }
  | {
      mode: "updateScene";
      name: string;
      elements: readonly ExcalidrawElement[];
    };

const DEFAULT_CONTAINER_NAME = STORAGE_KEYS.LOCAL_STORAGE_DEFAULT_CONTAINER_NAME;

type DesktopStateCache = {
  initialized: boolean;
  containerId: string | null;
  currentContainerName: string;
  containerList: string[];
  scenes: Record<string, readonly ExcalidrawElement[]>;
  appState: Partial<AppState> | null;
  libraryItems: ImportedDataState["libraryItems"];
};

const storageCache: DesktopStateCache = {
  initialized: false,
  containerId: null,
  currentContainerName: DEFAULT_CONTAINER_NAME,
  containerList: [DEFAULT_CONTAINER_NAME],
  scenes: {
    [DEFAULT_CONTAINER_NAME]: [],
  },
  appState: null,
  libraryItems: [],
};

let bootstrapPromise: Promise<DesktopBootstrapState> | null = null;

const clone = <T>(value: T): T => {
  if (value === undefined || value === null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
};

export const getDesktopApi = () => window.handrawDesktop;

export const requireDesktopApi = () => {
  const desktop = getDesktopApi();
  if (!desktop?.isElectron) {
    throw new Error(
      "Handraw must run inside the Electron desktop shell. preload bridge was not found.",
    );
  }

  return desktop;
};

const ensureSceneEntry = (containerName: string) => {
  if (!storageCache.scenes[containerName]) {
    storageCache.scenes[containerName] = [];
  }
};

const applyBootstrapState = (state: DesktopBootstrapState) => {
  const containerList =
    state.containerList.length > 0
      ? [...state.containerList]
      : [DEFAULT_CONTAINER_NAME];
  const currentContainerName =
    state.containerName && containerList.includes(state.containerName)
      ? state.containerName
      : containerList[0];

  storageCache.initialized = true;
  storageCache.containerList = containerList;
  storageCache.currentContainerName = currentContainerName;
  storageCache.appState = state.appState ? clone(state.appState) : null;
  storageCache.libraryItems = state.libraryItems ? clone(state.libraryItems) : [];
  storageCache.scenes = Object.keys(state.scenes || {}).length
    ? clone(state.scenes)
    : {
        [currentContainerName]: clone(state.elements || []),
      };

  for (const containerName of containerList) {
    ensureSceneEntry(containerName);
  }
};

const getDefaultBootstrapState = (): DesktopBootstrapState => ({
  containerList: [DEFAULT_CONTAINER_NAME],
  containerName: DEFAULT_CONTAINER_NAME,
  elements: [],
  appState: null,
  scenes: {
    [DEFAULT_CONTAINER_NAME]: [],
  },
  libraryItems: [],
  settings: {
    currentContainerName: DEFAULT_CONTAINER_NAME,
  },
});

export const bootstrapDesktopState = async () => {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const desktop = requireDesktopApi();
      const snapshot = await desktop.loadDesktopState();
      const nextState: DesktopBootstrapState = {
        ...getDefaultBootstrapState(),
        ...snapshot,
        scenes:
          snapshot?.scenes && Object.keys(snapshot.scenes).length
            ? snapshot.scenes
            : getDefaultBootstrapState().scenes,
        libraryItems: snapshot?.libraryItems || [],
      };
      applyBootstrapState(nextState);
      return nextState;
    })();
  }

  return bootstrapPromise;
};

export const resetDesktopStateCache = () => {
  bootstrapPromise = null;
  Object.assign(storageCache, getDefaultBootstrapState(), {
    initialized: false,
    containerId: null,
  });
};

const persistSettings = async () => {
  const desktop = requireDesktopApi();
  await desktop.saveSettings({
    currentContainerName: storageCache.currentContainerName,
  });
};

export const getDesktopDraftState = () => {
  const currentContainerName = getContainerNameFromStorage();
  const savedElements = storageCache.scenes[currentContainerName] || [];
  const savedState = storageCache.appState;

  let elements: ExcalidrawElement[] = [];
  if (savedElements) {
    try {
      elements = clearElementsForLocalStorage(clone(savedElements));
    } catch (error: any) {
      console.error(error);
    }
  }

  let appState = null;
  if (savedState) {
    try {
      appState = {
        ...getDefaultAppState(),
        ...clearAppStateForLocalStorage(clone(savedState) as Partial<AppState>),
        name: currentContainerName,
      };
    } catch (error: any) {
      console.error(error);
    }
  }

  return { elements, appState };
};

export const saveDraftStateToStorage = async (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  const desktop = requireDesktopApi();
  const currentContainerName = getContainerNameFromStorage();

  storageCache.currentContainerName = currentContainerName;
  storageCache.appState = {
    ...clearAppStateForLocalStorage(clone(appState)),
    name: currentContainerName,
  };
  storageCache.scenes[currentContainerName] = clone(
    clearElementsForLocalStorage(elements),
  );

  await desktop.saveDraftState({
    containerName: currentContainerName,
    elements: storageCache.scenes[currentContainerName],
    appState: storageCache.appState,
  });
};

export const getElementsStorageSize = () => {
  try {
    const currentContainerName = getContainerNameFromStorage();
    const elements = storageCache.scenes[currentContainerName] || [];
    return JSON.stringify(elements).length;
  } catch (error: any) {
    console.error(error);
    return 0;
  }
};

export const getTotalStorageSize = () => {
  try {
    const appState = storageCache.appState || {};
    const library = storageCache.libraryItems || [];
    const containers = storageCache.containerList || [];

    return (
      JSON.stringify(appState).length +
      JSON.stringify(library).length +
      JSON.stringify(containers).length +
      getElementsStorageSize()
    );
  } catch (error: any) {
    console.error(error);
    return 0;
  }
};

export const getLibraryItems = () => {
  return clone(storageCache.libraryItems || []);
};

export const saveLibraryItems = async (
  libraryItems: ImportedDataState["libraryItems"],
) => {
  storageCache.libraryItems = libraryItems ? clone(libraryItems) : [];
  const desktop = requireDesktopApi();
  return desktop.saveLibraryState(storageCache.libraryItems as any);
};

export const clearLibraryItems = async () => {
  return saveLibraryItems([]);
};

export const setContainerIdToStorage = (id: string) => {
  storageCache.containerId = id;
};

export const setContainerNameToStorage = (name: string) => {
  if (!name) {
    return;
  }

  storageCache.currentContainerName = name;
  if (storageCache.appState) {
    storageCache.appState = {
      ...storageCache.appState,
      name,
    };
  }
  if (!storageCache.containerList.includes(name)) {
    storageCache.containerList = [...storageCache.containerList, name];
  }
  ensureSceneEntry(name);
  void persistSettings();
};

export const getContainerIdFromStorage = () => {
  return storageCache.containerId;
};

export const getContainerNameFromStorage = () => {
  return storageCache.currentContainerName || DEFAULT_CONTAINER_NAME;
};

export const getContainerListFromStorage = (): string[] => {
  return [...storageCache.containerList];
};

export const createContainerInStorage = async (name: string) => {
  const desktop = requireDesktopApi();
  storageCache.currentContainerName = name;
  storageCache.appState = {
    ...(storageCache.appState || {}),
    name,
  };
  if (!storageCache.containerList.includes(name)) {
    storageCache.containerList = [...storageCache.containerList, name];
  }
  storageCache.scenes[name] = [];

  const nextState = await desktop.writeContainer({
    mode: "create",
    name,
    elements: [],
  });
  applyBootstrapState({
    ...getDefaultBootstrapState(),
    ...nextState,
    libraryItems: storageCache.libraryItems,
  });
};

export const setContainerListToStorage = (list: string[] = []) => {
  storageCache.containerList = list.length ? [...list] : [DEFAULT_CONTAINER_NAME];
};

export const getElementsFromStorage = (
  containerName?: string,
): ExcalidrawElement[] => {
  return clone(
    storageCache.scenes[containerName || getContainerNameFromStorage()] || [],
  ) as ExcalidrawElement[];
};

export const setElementsToStorage = async (
  elements: ExcalidrawElement[] = [],
) => {
  const currentContainerName = getContainerNameFromStorage();
  storageCache.scenes[currentContainerName] = clone(elements);
  const desktop = requireDesktopApi();

  await desktop.writeContainer({
    mode: "updateScene",
    name: currentContainerName,
    elements,
  });
};

export const renameContainerNameToStorage = async (
  oldName: string,
  newName: string,
) => {
  if (!(oldName && newName)) {
    console.warn(
      `oldName: ${oldName}, newName: ${newName} 不同时存在，无法重命名`,
    );
    return;
  }

  const elements = getElementsFromStorage(oldName);
  const desktop = requireDesktopApi();

  delete storageCache.scenes[oldName];
  storageCache.scenes[newName] = elements;
  storageCache.containerList = storageCache.containerList.map((name) =>
    name === oldName ? newName : name,
  );
  storageCache.currentContainerName =
    storageCache.currentContainerName === oldName
      ? newName
      : storageCache.currentContainerName;
  if (storageCache.appState?.name === oldName) {
    storageCache.appState = {
      ...storageCache.appState,
      name: newName,
    };
  }

  const nextState = await desktop.writeContainer({
    mode: "rename",
    previousName: oldName,
    name: newName,
    elements,
  });
  applyBootstrapState({
    ...getDefaultBootstrapState(),
    ...nextState,
    libraryItems: storageCache.libraryItems,
  });
};

export const removeContainerFromStorage = async (containerName: string) => {
  const desktop = requireDesktopApi();

  delete storageCache.scenes[containerName];
  storageCache.containerList = storageCache.containerList.filter(
    (name) => name !== containerName,
  );
  if (!storageCache.containerList.length) {
    storageCache.containerList = [DEFAULT_CONTAINER_NAME];
    ensureSceneEntry(DEFAULT_CONTAINER_NAME);
  }

  if (storageCache.currentContainerName === containerName) {
    storageCache.currentContainerName = storageCache.containerList[0];
    if (storageCache.appState) {
      storageCache.appState = {
        ...storageCache.appState,
        name: storageCache.currentContainerName,
      };
    }
  }

  const nextState = await desktop.deleteContainer(containerName);
  applyBootstrapState({
    ...getDefaultBootstrapState(),
    ...nextState,
    libraryItems: storageCache.libraryItems,
  });
};

export const getAllContainerListElementsFromStorage = () => {
  return storageCache.containerList.reduce((prevElements, containerName) => {
    const elements = storageCache.scenes[containerName] || [];
    return [...prevElements, ...elements];
  }, [] as ExcalidrawElement[]);
};

export const readFilesFromStorage = async (ids: FileId[]) => {
  const desktop = requireDesktopApi();
  const payload = await desktop.readBinaryFileCache(ids);
  return {
    loadedFiles: payload.loadedFiles || [],
    erroredFiles: new Map(
      (payload.erroredFiles || []).map((fileId: FileId) => [
        fileId,
        true as const,
      ]),
    ),
  };
};

export const writeFilesToStorage = async (files: BinaryFileData[]) => {
  const desktop = requireDesktopApi();
  const payload = await desktop.writeBinaryFileCache(files);
  return {
    savedFiles: new Map(
      (payload.savedFiles || []).map((fileId: FileId) => [
        fileId,
        true as const,
      ]),
    ),
    erroredFiles: new Map(
      (payload.erroredFiles || []).map((fileId: FileId) => [
        fileId,
        true as const,
      ]),
    ),
  };
};

export const clearObsoleteFilesFromStorage = async (currentFileIds: FileId[]) => {
  const desktop = requireDesktopApi();
  await desktop.pruneBinaryFileCache(currentFileIds);
};

export const getDesktopStateSnapshot = () => {
  return clone({
    containerId: storageCache.containerId,
    currentContainerName: storageCache.currentContainerName,
    containerList: storageCache.containerList,
    appState: storageCache.appState,
    libraryItems: storageCache.libraryItems,
    scenes: storageCache.scenes,
  });
};
