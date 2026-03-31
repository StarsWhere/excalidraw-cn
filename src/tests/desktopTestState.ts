import { ExcalidrawElement, FileId } from "../element/types";
import { ImportedDataState } from "../data/types";
import { AppState, BinaryFileData } from "../types";

const DEFAULT_BOARD_NAME = "default-board";

type DesktopTestState = {
  currentBoardName: string;
  boardList: string[];
  scenes: Record<string, readonly ExcalidrawElement[]>;
  appState: Partial<AppState> | null;
  libraryItems: ImportedDataState["libraryItems"];
  files: Record<string, BinaryFileData>;
};

const createDefaultState = (): DesktopTestState => ({
  currentBoardName: DEFAULT_BOARD_NAME,
  boardList: [DEFAULT_BOARD_NAME],
  scenes: {
    [DEFAULT_BOARD_NAME]: [],
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
  const currentBoardName = desktopTestState.currentBoardName;
  desktopTestState.scenes[currentBoardName] = clone(data.elements || []);
  desktopTestState.appState = data.appState ? clone(data.appState) : null;
};

export const getDesktopTestState = () => clone(desktopTestState);

export const desktopApiMock = {
  isElectron: true,
  platform: "win32",
  loadDesktopState: async () => ({
    boardList: clone(desktopTestState.boardList),
    boardName: desktopTestState.currentBoardName,
    elements: clone(
      desktopTestState.scenes[desktopTestState.currentBoardName] || [],
    ),
    appState: clone(desktopTestState.appState),
    scenes: clone(desktopTestState.scenes),
    libraryItems: clone(desktopTestState.libraryItems),
    settings: {
      currentBoardName: desktopTestState.currentBoardName,
    },
  }),
  saveDesktopState: async ({
    boardName,
    elements,
    appState,
  }: {
    boardName: string;
    elements: readonly ExcalidrawElement[];
    appState: Partial<AppState>;
  }) => {
    desktopTestState.currentBoardName = boardName;
    if (!desktopTestState.boardList.includes(boardName)) {
      desktopTestState.boardList.push(boardName);
    }
    desktopTestState.scenes[boardName] = clone(elements);
    desktopTestState.appState = clone(appState);
    return desktopApiMock.loadDesktopState();
  },
  loadLibraryState: async () => clone(desktopTestState.libraryItems),
  saveLibraryState: async (items: ImportedDataState["libraryItems"]) => {
    desktopTestState.libraryItems = clone(items || []);
    return clone(desktopTestState.libraryItems);
  },
  listBoards: async () => clone(desktopTestState.boardList),
  writeBoard: async ({
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
      if (!desktopTestState.boardList.includes(name)) {
        desktopTestState.boardList.push(name);
      }
      desktopTestState.scenes[name] = clone(elements || []);
      desktopTestState.currentBoardName = name;
    } else if (mode === "rename" && previousName) {
      desktopTestState.boardList = desktopTestState.boardList.map(
        (boardName) => (boardName === previousName ? name : boardName),
      );
      desktopTestState.scenes[name] = clone(
        elements || desktopTestState.scenes[previousName] || [],
      );
      delete desktopTestState.scenes[previousName];
      if (desktopTestState.currentBoardName === previousName) {
        desktopTestState.currentBoardName = name;
      }
    } else if (mode === "updateScene") {
      desktopTestState.scenes[name] = clone(elements || []);
    } else if (mode === "select") {
      desktopTestState.currentBoardName = name;
    }

    return desktopApiMock.loadDesktopState();
  },
  deleteBoard: async (name: string) => {
    desktopTestState.boardList = desktopTestState.boardList.filter(
      (boardName) => boardName !== name,
    );
    delete desktopTestState.scenes[name];
    if (!desktopTestState.boardList.length) {
      desktopTestState = createDefaultState();
    } else if (desktopTestState.currentBoardName === name) {
      desktopTestState.currentBoardName = desktopTestState.boardList[0];
    }
    return desktopApiMock.loadDesktopState();
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
    currentBoardName,
  }: {
    currentBoardName?: string;
  }) => {
    if (currentBoardName) {
      desktopTestState.currentBoardName = currentBoardName;
      if (!desktopTestState.boardList.includes(currentBoardName)) {
        desktopTestState.boardList.push(currentBoardName);
      }
    }
    return {
      currentBoardName: desktopTestState.currentBoardName,
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
