import { ExcalidrawElement, FileId } from "@editor/elements/types";
import { ImportedDataState } from "@editor/io/types";
import {
  AppState,
  BinaryFileData,
  LibraryItems,
} from "@editor/state/types";

const DEFAULT_BOARD_NAME = "default-board";

type WorkspaceTestState = {
  currentBoardName: string;
  boardList: string[];
  scenes: Record<string, readonly ExcalidrawElement[]>;
  appState: Partial<AppState> | null;
  libraryItems: LibraryItems;
  files: Record<string, BinaryFileData>;
};

const createDefaultState = (): WorkspaceTestState => ({
  currentBoardName: DEFAULT_BOARD_NAME,
  boardList: [DEFAULT_BOARD_NAME],
  scenes: {
    [DEFAULT_BOARD_NAME]: [],
  },
  appState: null,
  libraryItems: [],
  files: {},
});

let workspaceTestState = createDefaultState();

const clone = <T>(value: T): T => {
  if (value === undefined || value === null) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
};

export const resetWorkspaceTestState = () => {
  workspaceTestState = createDefaultState();
};

export const setWorkspaceDraftState = (data: ImportedDataState) => {
  const currentBoardName = workspaceTestState.currentBoardName;
  workspaceTestState.scenes[currentBoardName] = clone(data.elements || []);
  workspaceTestState.appState = data.appState ? clone(data.appState) : null;
};

export const getWorkspaceTestState = () => clone(workspaceTestState);

export const desktopApiMock = {
  isElectron: true,
  platform: "win32",
  loadWorkspaceState: async () => ({
    boardList: clone(workspaceTestState.boardList),
    boardName: workspaceTestState.currentBoardName,
    elements: clone(
      workspaceTestState.scenes[workspaceTestState.currentBoardName] || [],
    ),
    appState: clone(workspaceTestState.appState),
    scenes: clone(workspaceTestState.scenes),
    libraryItems: clone(workspaceTestState.libraryItems),
    settings: {
      currentBoardName: workspaceTestState.currentBoardName,
    },
  }),
  saveWorkspaceState: async ({
    boardName,
    elements,
    appState,
  }: {
    boardName: string;
    elements: readonly ExcalidrawElement[];
    appState: Partial<AppState>;
  }) => {
    workspaceTestState.currentBoardName = boardName;
    if (!workspaceTestState.boardList.includes(boardName)) {
      workspaceTestState.boardList.push(boardName);
    }
    workspaceTestState.scenes[boardName] = clone(elements);
    workspaceTestState.appState = clone(appState);
    return desktopApiMock.loadWorkspaceState();
  },
  loadLibraryState: async () => clone(workspaceTestState.libraryItems),
  saveLibraryState: async (items: LibraryItems) => {
    workspaceTestState.libraryItems = clone(items);
    return clone(workspaceTestState.libraryItems);
  },
  listBoards: async () => clone(workspaceTestState.boardList),
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
      if (!workspaceTestState.boardList.includes(name)) {
        workspaceTestState.boardList.push(name);
      }
      workspaceTestState.scenes[name] = clone(elements || []);
      workspaceTestState.currentBoardName = name;
    } else if (mode === "rename" && previousName) {
      workspaceTestState.boardList = workspaceTestState.boardList.map(
        (boardName) => (boardName === previousName ? name : boardName),
      );
      workspaceTestState.scenes[name] = clone(
        elements || workspaceTestState.scenes[previousName] || [],
      );
      delete workspaceTestState.scenes[previousName];
      if (workspaceTestState.currentBoardName === previousName) {
        workspaceTestState.currentBoardName = name;
      }
    } else if (mode === "updateScene") {
      workspaceTestState.scenes[name] = clone(elements || []);
    } else if (mode === "select") {
      workspaceTestState.currentBoardName = name;
    }

    return desktopApiMock.loadWorkspaceState();
  },
  deleteBoard: async (name: string) => {
    workspaceTestState.boardList = workspaceTestState.boardList.filter(
      (boardName) => boardName !== name,
    );
    delete workspaceTestState.scenes[name];
    if (!workspaceTestState.boardList.length) {
      workspaceTestState = createDefaultState();
    } else if (workspaceTestState.currentBoardName === name) {
      workspaceTestState.currentBoardName = workspaceTestState.boardList[0];
    }
    return desktopApiMock.loadWorkspaceState();
  },
  readBinaryFileCache: async (fileIds: FileId[]) => {
    const loadedFiles: BinaryFileData[] = [];
    const erroredFiles: FileId[] = [];

    fileIds.forEach((fileId) => {
      const fileData = workspaceTestState.files[fileId];
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
      workspaceTestState.files[fileData.id] = clone(fileData);
      savedFiles.push(fileData.id);
    });
    return { savedFiles, erroredFiles: [] as FileId[] };
  },
  pruneBinaryFileCache: async (fileIds: FileId[]) => {
    const keep = new Set(fileIds);
    Object.keys(workspaceTestState.files).forEach((fileId) => {
      if (!keep.has(fileId as FileId)) {
        delete workspaceTestState.files[fileId];
      }
    });
  },
  saveSettings: async ({
    currentBoardName,
  }: {
    currentBoardName?: string;
  }) => {
    if (currentBoardName) {
      workspaceTestState.currentBoardName = currentBoardName;
      if (!workspaceTestState.boardList.includes(currentBoardName)) {
        workspaceTestState.boardList.push(currentBoardName);
      }
    }
    return {
      currentBoardName: workspaceTestState.currentBoardName,
    };
  },
  resetWorkspaceState: async () => {
    resetWorkspaceTestState();
    return desktopApiMock.loadWorkspaceState();
  },
  openFile: async () => null,
  saveFile: async () => null,
  readFile: async () => null,
  getPendingOpenFile: async () => null,
  onOpenFile: () => () => undefined,
  openExternal: async () => undefined,
};
