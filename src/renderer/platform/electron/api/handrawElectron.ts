import type {
  WorkspaceBoardSavePayload,
  WorkspaceBoardState,
  WorkspaceBoardWritePayload,
  WorkspaceBootstrapState,
  WorkspaceSettings,
} from "@workspace/state/workspaceState";
import type { FileId } from "@editor/elements/types";
import type {
  BinaryFileData,
  LibraryItems,
} from "@editor/state/types";
import type {
  ElectronFilePayload,
  ElectronOpenDialogOptions,
  ElectronSaveDialogPayload,
  NativeFileHandle,
} from "./filesystem";

export type HandrawElectronApi = {
  isElectron: boolean;
  platform: string;
  loadWorkspaceState: () => Promise<WorkspaceBootstrapState>;
  saveWorkspaceState: (
    payload: WorkspaceBoardSavePayload,
  ) => Promise<WorkspaceBoardState>;
  loadLibraryState: () => Promise<LibraryItems>;
  saveLibraryState: (items: LibraryItems) => Promise<LibraryItems>;
  listBoards: () => Promise<string[]>;
  writeBoard: (payload: WorkspaceBoardWritePayload) => Promise<WorkspaceBoardState>;
  deleteBoard: (name: string) => Promise<WorkspaceBoardState>;
  readBinaryFileCache: (fileIds: FileId[]) => Promise<{
    loadedFiles: BinaryFileData[];
    erroredFiles: FileId[];
  }>;
  writeBinaryFileCache: (files: BinaryFileData[]) => Promise<{
    savedFiles: FileId[];
    erroredFiles: FileId[];
  }>;
  pruneBinaryFileCache: (fileIds: FileId[]) => Promise<void>;
  saveSettings: (settings: Partial<WorkspaceSettings>) => Promise<WorkspaceSettings>;
  resetWorkspaceState: () => Promise<WorkspaceBootstrapState>;
  openFile: (
    options: ElectronOpenDialogOptions,
  ) => Promise<ElectronFilePayload | ElectronFilePayload[] | null>;
  saveFile: (
    payload: ElectronSaveDialogPayload,
  ) => Promise<NativeFileHandle | null>;
  readFile: (filePath: string) => Promise<ElectronFilePayload | null>;
  getPendingOpenFile: () => Promise<ElectronFilePayload | null>;
  onOpenFile: (listener: (payload: ElectronFilePayload) => void) => () => void;
  openExternal: (url: string) => Promise<void>;
};

export const getHandrawElectronApi = (): HandrawElectronApi | undefined =>
  window.handrawElectron;

export const requireHandrawElectronApi = (): HandrawElectronApi => {
  const api = getHandrawElectronApi();
  if (!api?.isElectron) {
    throw new Error(
      "Handraw must run inside the Electron desktop shell. preload bridge was not found.",
    );
  }

  return api;
};

export const setHandrawElectronApiForTests = (api: HandrawElectronApi) => {
  Object.defineProperty(window, "handrawElectron", {
    configurable: true,
    writable: true,
    value: api,
  });
};

export const clearHandrawElectronApiForTests = () => {
  delete (window as Partial<Window>).handrawElectron;
};
