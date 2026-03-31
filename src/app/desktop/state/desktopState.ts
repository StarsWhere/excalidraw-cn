import { ExcalidrawElement, FileId } from "../../../core/editor/elements/types";
import { AppState, BinaryFileData } from "../../../core/editor/state/types";
import {
  clearAppStateForLocalState,
  getDefaultAppState,
} from "../../../core/editor/state/appState";
import { clearElementsForLocalState } from "../../../core/editor/elements";
import { DEFAULT_BOARD_NAME } from "./constants";
import { ImportedDataState } from "../../../core/editor/io/types";
import {
  getHandrawDesktopApi,
  requireHandrawDesktopApi,
} from "../../../platform/desktop/api/handrawDesktop";

export type DesktopSettings = {
  currentBoardName: string;
};

export type DesktopBoardState = {
  boardList: string[];
  boardName: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState> | null;
  scenes: Record<string, readonly ExcalidrawElement[]>;
};

export type DesktopBootstrapState = DesktopBoardState & {
  libraryItems: ImportedDataState["libraryItems"];
  settings?: DesktopSettings;
};

export type DesktopBoardSavePayload = {
  boardName: string;
  elements: readonly ExcalidrawElement[];
  appState: Partial<AppState>;
};

export type DesktopBoardWritePayload =
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

type DesktopStateCache = {
  initialized: boolean;
  currentBoardName: string;
  boardList: string[];
  scenes: Record<string, readonly ExcalidrawElement[]>;
  appState: Partial<AppState> | null;
  libraryItems: ImportedDataState["libraryItems"];
};

const storageCache: DesktopStateCache = {
  initialized: false,
  currentBoardName: DEFAULT_BOARD_NAME,
  boardList: [DEFAULT_BOARD_NAME],
  scenes: {
    [DEFAULT_BOARD_NAME]: [],
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

export const getDesktopApi = () => getHandrawDesktopApi();

export const requireDesktopApi = () => requireHandrawDesktopApi();

const ensureBoardEntry = (boardName: string) => {
  if (!storageCache.scenes[boardName]) {
    storageCache.scenes[boardName] = [];
  }
};

const applyBootstrapState = (state: DesktopBootstrapState) => {
  const boardList =
    state.boardList.length > 0 ? [...state.boardList] : [DEFAULT_BOARD_NAME];
  const currentBoardName =
    state.boardName && boardList.includes(state.boardName)
      ? state.boardName
      : boardList[0];

  storageCache.initialized = true;
  storageCache.boardList = boardList;
  storageCache.currentBoardName = currentBoardName;
  storageCache.appState = state.appState ? clone(state.appState) : null;
  storageCache.libraryItems = state.libraryItems ? clone(state.libraryItems) : [];
  storageCache.scenes = Object.keys(state.scenes || {}).length
    ? clone(state.scenes)
    : {
        [currentBoardName]: clone(state.elements || []),
      };

  for (const boardName of boardList) {
    ensureBoardEntry(boardName);
  }
};

const getDefaultBootstrapState = (): DesktopBootstrapState => ({
  boardList: [DEFAULT_BOARD_NAME],
  boardName: DEFAULT_BOARD_NAME,
  elements: [],
  appState: null,
  scenes: {
    [DEFAULT_BOARD_NAME]: [],
  },
  libraryItems: [],
  settings: {
    currentBoardName: DEFAULT_BOARD_NAME,
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

export const refreshDesktopState = async () => {
  bootstrapPromise = null;
  return bootstrapDesktopState();
};

export const resetDesktopStateCache = () => {
  bootstrapPromise = null;
  Object.assign(storageCache, getDefaultBootstrapState(), {
    initialized: false,
  });
};

const persistSettings = async () => {
  const desktop = requireDesktopApi();
  await desktop.saveSettings({
    currentBoardName: storageCache.currentBoardName,
  });
};

export const getDesktopDraftState = () => {
  const currentBoardName = getCurrentBoardName();
  const savedElements = storageCache.scenes[currentBoardName] || [];
  const savedState = storageCache.appState;

  let elements: ExcalidrawElement[] = [];
  if (savedElements) {
    try {
      elements = clearElementsForLocalState(clone(savedElements));
    } catch (error: any) {
      console.error(error);
    }
  }

  let appState = null;
  if (savedState) {
    try {
      appState = {
        ...getDefaultAppState(),
        ...clearAppStateForLocalState(clone(savedState) as Partial<AppState>),
        name: currentBoardName,
      };
    } catch (error: any) {
      console.error(error);
    }
  }

  return { elements, appState };
};

export const saveDesktopStateToStorage = async (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  const desktop = requireDesktopApi();
  const currentBoardName = getCurrentBoardName();

  storageCache.currentBoardName = currentBoardName;
  storageCache.appState = {
    ...clearAppStateForLocalState(clone(appState)),
    name: currentBoardName,
  };
  storageCache.scenes[currentBoardName] = clone(
    clearElementsForLocalState(elements),
  );

  const nextState = await desktop.saveDesktopState({
    boardName: currentBoardName,
    elements: storageCache.scenes[currentBoardName],
    appState: storageCache.appState,
  });
  applyBootstrapState({
    ...getDefaultBootstrapState(),
    ...nextState,
    libraryItems: storageCache.libraryItems,
  });
};

export const getElementsStorageSize = () => {
  try {
    const currentBoardName = getCurrentBoardName();
    const elements = storageCache.scenes[currentBoardName] || [];
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
    const boards = storageCache.boardList || [];

    return (
      JSON.stringify(appState).length +
      JSON.stringify(library).length +
      JSON.stringify(boards).length +
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

export const setCurrentBoardName = (name: string) => {
  if (!name) {
    return;
  }

  storageCache.currentBoardName = name;
  if (storageCache.appState) {
    storageCache.appState = {
      ...storageCache.appState,
      name,
    };
  }
  if (!storageCache.boardList.includes(name)) {
    storageCache.boardList = [...storageCache.boardList, name];
  }
  ensureBoardEntry(name);
  void persistSettings();
};

export const getCurrentBoardName = () => {
  return storageCache.currentBoardName || DEFAULT_BOARD_NAME;
};

export const getBoardListFromStorage = (): string[] => {
  return [...storageCache.boardList];
};

export const createBoardInStorage = async (name: string) => {
  const desktop = requireDesktopApi();
  storageCache.currentBoardName = name;
  storageCache.appState = {
    ...(storageCache.appState || {}),
    name,
  };
  if (!storageCache.boardList.includes(name)) {
    storageCache.boardList = [...storageCache.boardList, name];
  }
  storageCache.scenes[name] = [];

  const nextState = await desktop.writeBoard({
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

export const getBoardElementsFromStorage = (
  boardName?: string,
): ExcalidrawElement[] => {
  return clone(
    storageCache.scenes[boardName || getCurrentBoardName()] || [],
  ) as ExcalidrawElement[];
};

export const setBoardElementsToStorage = async (
  elements: ExcalidrawElement[] = [],
) => {
  const currentBoardName = getCurrentBoardName();
  storageCache.scenes[currentBoardName] = clone(elements);
  const desktop = requireDesktopApi();

  const nextState = await desktop.writeBoard({
    mode: "updateScene",
    name: currentBoardName,
    elements,
  });

  applyBootstrapState({
    ...getDefaultBootstrapState(),
    ...nextState,
    libraryItems: storageCache.libraryItems,
  });
};

export const renameBoardNameInStorage = async (
  oldName: string,
  newName: string,
) => {
  if (!(oldName && newName)) {
    console.warn(
      `oldName: ${oldName}, newName: ${newName} do not both exist, rename aborted.`,
    );
    return;
  }

  const elements = getBoardElementsFromStorage(oldName);
  const desktop = requireDesktopApi();

  delete storageCache.scenes[oldName];
  storageCache.scenes[newName] = elements;
  storageCache.boardList = storageCache.boardList.map((name) =>
    name === oldName ? newName : name,
  );
  storageCache.currentBoardName =
    storageCache.currentBoardName === oldName
      ? newName
      : storageCache.currentBoardName;
  if (storageCache.appState?.name === oldName) {
    storageCache.appState = {
      ...storageCache.appState,
      name: newName,
    };
  }

  const nextState = await desktop.writeBoard({
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

export const selectBoardInStorage = async (boardName: string) => {
  storageCache.currentBoardName = boardName;
  if (storageCache.appState) {
    storageCache.appState = {
      ...storageCache.appState,
      name: boardName,
    };
  }

  const desktop = requireDesktopApi();
  const nextState = await desktop.writeBoard({
    mode: "select",
    name: boardName,
  });
  applyBootstrapState({
    ...getDefaultBootstrapState(),
    ...nextState,
    libraryItems: storageCache.libraryItems,
  });
};

export const removeBoardFromStorage = async (boardName: string) => {
  const desktop = requireDesktopApi();

  delete storageCache.scenes[boardName];
  storageCache.boardList = storageCache.boardList.filter((name) => name !== boardName);
  if (!storageCache.boardList.length) {
    storageCache.boardList = [DEFAULT_BOARD_NAME];
    ensureBoardEntry(DEFAULT_BOARD_NAME);
  }

  if (storageCache.currentBoardName === boardName) {
    storageCache.currentBoardName = storageCache.boardList[0];
    if (storageCache.appState) {
      storageCache.appState = {
        ...storageCache.appState,
        name: storageCache.currentBoardName,
      };
    }
  }

  const nextState = await desktop.deleteBoard(boardName);
  applyBootstrapState({
    ...getDefaultBootstrapState(),
    ...nextState,
    libraryItems: storageCache.libraryItems,
  });
};

export const getAllBoardElementsFromStorage = () => {
  return storageCache.boardList.reduce((prevElements, boardName) => {
    const elements = storageCache.scenes[boardName] || [];
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
      (payload.savedFiles || []).map((fileId: FileId) => [fileId, true as const]),
    ),
    erroredFiles: new Map(
      (payload.erroredFiles || []).map((fileId: FileId) => [fileId, true as const]),
    ),
  };
};

export const clearObsoleteFilesFromStorage = async (currentFileIds: FileId[]) => {
  const desktop = requireDesktopApi();
  await desktop.pruneBinaryFileCache(currentFileIds);
};

export const getDesktopStateSnapshot = () => {
  return clone({
    currentBoardName: storageCache.currentBoardName,
    boardList: storageCache.boardList,
    appState: storageCache.appState,
    libraryItems: storageCache.libraryItems,
    scenes: storageCache.scenes,
  });
};
