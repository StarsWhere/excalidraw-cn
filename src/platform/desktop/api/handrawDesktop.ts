import type {
  DesktopBoardSavePayload,
  DesktopBoardState,
  DesktopBoardWritePayload,
  DesktopBootstrapState,
  DesktopSettings,
} from "../../../app/desktop/state/desktopState";
import type { FileId } from "../../../core/editor/elements/types";
import type {
  BinaryFileData,
  LibraryItems,
} from "../../../core/editor/state/types";
import type {
  DesktopFilePayload,
  DesktopOpenDialogOptions,
  DesktopSaveDialogPayload,
  NativeFileHandle,
} from "./filesystem";

export type HandrawDesktopApi = {
  isElectron: boolean;
  platform: string;
  loadDesktopState: () => Promise<DesktopBootstrapState>;
  saveDesktopState: (
    payload: DesktopBoardSavePayload,
  ) => Promise<DesktopBoardState>;
  loadLibraryState: () => Promise<LibraryItems>;
  saveLibraryState: (items: LibraryItems) => Promise<LibraryItems>;
  listBoards: () => Promise<string[]>;
  writeBoard: (payload: DesktopBoardWritePayload) => Promise<DesktopBoardState>;
  deleteBoard: (name: string) => Promise<DesktopBoardState>;
  readBinaryFileCache: (fileIds: FileId[]) => Promise<{
    loadedFiles: BinaryFileData[];
    erroredFiles: FileId[];
  }>;
  writeBinaryFileCache: (files: BinaryFileData[]) => Promise<{
    savedFiles: FileId[];
    erroredFiles: FileId[];
  }>;
  pruneBinaryFileCache: (fileIds: FileId[]) => Promise<void>;
  saveSettings: (settings: Partial<DesktopSettings>) => Promise<DesktopSettings>;
  resetDesktopState: () => Promise<DesktopBootstrapState>;
  openFile: (
    options: DesktopOpenDialogOptions,
  ) => Promise<DesktopFilePayload | DesktopFilePayload[] | null>;
  saveFile: (
    payload: DesktopSaveDialogPayload,
  ) => Promise<NativeFileHandle | null>;
  readFile: (filePath: string) => Promise<DesktopFilePayload | null>;
  getPendingOpenFile: () => Promise<DesktopFilePayload | null>;
  onOpenFile: (listener: (payload: DesktopFilePayload) => void) => () => void;
  openExternal: (url: string) => Promise<void>;
};

export const getHandrawDesktopApi = (): HandrawDesktopApi | undefined =>
  window.handrawDesktop;

export const requireHandrawDesktopApi = (): HandrawDesktopApi => {
  const api = getHandrawDesktopApi();
  if (!api?.isElectron) {
    throw new Error(
      "Handraw must run inside the Electron desktop shell. preload bridge was not found.",
    );
  }

  return api;
};

export const setHandrawDesktopApiForTests = (api: HandrawDesktopApi) => {
  Object.defineProperty(window, "handrawDesktop", {
    configurable: true,
    writable: true,
    value: api,
  });
};

export const clearHandrawDesktopApiForTests = () => {
  delete (window as Partial<Window>).handrawDesktop;
};
