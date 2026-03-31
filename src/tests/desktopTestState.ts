import { ExcalidrawElement, FileId } from "../element/types";
import { ImportedDataState } from "../data/types";
import { AppState, BinaryFileData } from "../types";

const DEFAULT_CONTAINER_NAME = "default_canvas";

type DesktopTestState = {
  currentContainerName: string;
  containerList: string[];
  scenes: Record<string, readonly ExcalidrawElement[]>;
  appState: Partial<AppState> | null;
  libraryItems: ImportedDataState["libraryItems"];
  files: Record<string, BinaryFileData>;
};

const createDefaultState = (): DesktopTestState => ({
  currentContainerName: DEFAULT_CONTAINER_NAME,
  containerList: [DEFAULT_CONTAINER_NAME],
  scenes: {
    [DEFAULT_CONTAINER_NAME]: [],
  },
  appState: null,
  libraryItems: [],
  files: {},
});

let desktopTestState = createDefaultState();

const clone = <T>(value: T): T => {
  if (value === undefined || value === null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
};

export const resetDesktopTestState = () => {
  desktopTestState = createDefaultState();
};

export const setDesktopDraftState = (data: ImportedDataState) => {
  const currentContainerName = desktopTestState.currentContainerName;
  desktopTestState.scenes[currentContainerName] = clone(data.elements || []);
  desktopTestState.appState = data.appState ? clone(data.appState) : null;
};

export const getDesktopTestState = () => clone(desktopTestState);

export const desktopApiMock = {
  isElectron: true,
  platform: "win32",
  loadDesktopState: async () => ({
    containerList: clone(desktopTestState.containerList),
    containerName: desktopTestState.currentContainerName,
    elements: clone(
      desktopTestState.scenes[desktopTestState.currentContainerName] || [],
    ),
    appState: clone(desktopTestState.appState),
    scenes: clone(desktopTestState.scenes),
    libraryItems: clone(desktopTestState.libraryItems),
    settings: {
      currentContainerName: desktopTestState.currentContainerName,
    },
  }),
  loadDraftState: async () => ({
    containerList: clone(desktopTestState.containerList),
    containerName: desktopTestState.currentContainerName,
    elements: clone(
      desktopTestState.scenes[desktopTestState.currentContainerName] || [],
    ),
    appState: clone(desktopTestState.appState),
    scenes: clone(desktopTestState.scenes),
  }),
  saveDraftState: async ({
    containerName,
    elements,
    appState,
  }: {
    containerName: string;
    elements: readonly ExcalidrawElement[];
    appState: Partial<AppState>;
  }) => {
    desktopTestState.currentContainerName = containerName;
    if (!desktopTestState.containerList.includes(containerName)) {
      desktopTestState.containerList.push(containerName);
    }
    desktopTestState.scenes[containerName] = clone(elements);
    desktopTestState.appState = clone(appState);
    return desktopApiMock.loadDraftState();
  },
  loadLibraryState: async () => clone(desktopTestState.libraryItems),
  saveLibraryState: async (items: ImportedDataState["libraryItems"]) => {
    desktopTestState.libraryItems = clone(items || []);
    return clone(desktopTestState.libraryItems);
  },
  listContainers: async () => clone(desktopTestState.containerList),
  writeContainer: async ({
    mode,
    name,
    previousName,
    elements,
  }: {
    mode: "create" | "rename" | "updateScene" | "select";
    name: string;
    previousName?: string;
    elements?: readonly ExcalidrawElement[];
  }) => {
    if (mode === "create") {
      if (!desktopTestState.containerList.includes(name)) {
        desktopTestState.containerList.push(name);
      }
      desktopTestState.scenes[name] = clone(elements || []);
      desktopTestState.currentContainerName = name;
    } else if (mode === "rename" && previousName) {
      desktopTestState.containerList = desktopTestState.containerList.map(
        (containerName) => (containerName === previousName ? name : containerName),
      );
      desktopTestState.scenes[name] = clone(
        elements || desktopTestState.scenes[previousName] || [],
      );
      delete desktopTestState.scenes[previousName];
      if (desktopTestState.currentContainerName === previousName) {
        desktopTestState.currentContainerName = name;
      }
    } else if (mode === "updateScene") {
      desktopTestState.scenes[name] = clone(elements || []);
    } else if (mode === "select") {
      desktopTestState.currentContainerName = name;
    }

    return desktopApiMock.loadDraftState();
  },
  deleteContainer: async (name: string) => {
    desktopTestState.containerList = desktopTestState.containerList.filter(
      (containerName) => containerName !== name,
    );
    delete desktopTestState.scenes[name];
    if (!desktopTestState.containerList.length) {
      desktopTestState = createDefaultState();
    } else if (desktopTestState.currentContainerName === name) {
      desktopTestState.currentContainerName = desktopTestState.containerList[0];
    }
    return desktopApiMock.loadDraftState();
  },
  readBinaryFileCache: async (fileIds: FileId[]) => {
    const loadedFiles: BinaryFileData[] = [];
    const erroredFiles: FileId[] = [];

    fileIds.forEach((fileId) => {
      const fileData = desktopTestState.files[fileId];
      if (fileData) {
        loadedFiles.push({
          ...fileData,
          lastRetrieved: Date.now(),
        });
      } else {
        erroredFiles.push(fileId);
      }
    });

    return { loadedFiles, erroredFiles };
  },
  writeBinaryFileCache: async (files: BinaryFileData[]) => {
    const savedFiles: FileId[] = [];
    files.forEach((fileData) => {
      desktopTestState.files[fileData.id] = clone(fileData);
      savedFiles.push(fileData.id);
    });
    return { savedFiles, erroredFiles: [] as FileId[] };
  },
  pruneBinaryFileCache: async (fileIds: FileId[]) => {
    const keep = new Set(fileIds);
    Object.keys(desktopTestState.files).forEach((fileId) => {
      if (!keep.has(fileId as FileId)) {
        delete desktopTestState.files[fileId];
      }
    });
  },
  saveSettings: async ({
    currentContainerName,
  }: {
    currentContainerName?: string;
  }) => {
    if (currentContainerName) {
      desktopTestState.currentContainerName = currentContainerName;
      if (!desktopTestState.containerList.includes(currentContainerName)) {
        desktopTestState.containerList.push(currentContainerName);
      }
    }
    return {
      currentContainerName: desktopTestState.currentContainerName,
    };
  },
  resetDesktopState: async () => {
    resetDesktopTestState();
    return desktopApiMock.loadDesktopState();
  },
  openFile: async () => null,
  saveFile: async () => null,
  readFile: async () => null,
  getPendingOpenFile: async () => null,
  onOpenFile: () => () => undefined,
  openExternal: async () => undefined,
};
