/**
 * This file deals with saving draft state (appState, elements, images, ...)
 * to the Electron desktop persistence layer.
 */

import { clearAppStateForLocalState } from "../../appState";
import { ExcalidrawElement, FileId } from "../../element/types";
import { AppState, BinaryFileData, BinaryFiles } from "../../types";
import { debounce } from "../../utils";
import { SAVE_TO_DESKTOP_STORE_TIMEOUT } from "../app_constants";
import { FileManager } from "./FileManager";
import { Locker } from "./Locker";
import {
  clearObsoleteFilesFromStorage,
  readFilesFromStorage,
  saveDesktopStateToStorage,
  writeFilesToStorage,
} from "./desktopState";

class LocalFileManager extends FileManager {
  clearObsoleteFiles = async (opts: { currentFileIds: FileId[] }) => {
    await clearObsoleteFilesFromStorage(opts.currentFileIds);
  };
}

type SavingLockTypes = "desktop-write";

export class LocalData {
  private static _save = debounce(
    async (
      elements: readonly ExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles,
      onFilesSaved: () => void,
    ) => {
      await saveDesktopStateToStorage(
        elements,
        clearAppStateForLocalState(appState) as AppState,
      );

      await this.fileStorage.saveFiles({
        elements,
        files,
      });
      onFilesSaved();
    },
    SAVE_TO_DESKTOP_STORE_TIMEOUT,
  );

  static save = (
    elements: readonly ExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
    onFilesSaved: () => void,
  ) => {
    if (!this.isSavePaused()) {
      this._save(elements, appState, files, onFilesSaved);
    }
  };

  static flushSave = () => {
    this._save.flush();
  };

  private static locker = new Locker<SavingLockTypes>();

  static pauseSave = (lockType: SavingLockTypes) => {
    this.locker.lock(lockType);
  };

  static resumeSave = (lockType: SavingLockTypes) => {
    this.locker.unlock(lockType);
  };

  static isSavePaused = () => {
    return document.hidden || this.locker.isLocked();
  };

  static fileStorage = new LocalFileManager({
    getFiles(ids) {
      return readFilesFromStorage(ids);
    },
    async saveFiles({ addedFiles }) {
      const files = [...addedFiles.values()].map(
        (fileData) =>
          ({
            ...fileData,
            lastRetrieved: fileData.lastRetrieved || Date.now(),
          }) as BinaryFileData,
      );
      return writeFilesToStorage(files);
    },
  });
}
