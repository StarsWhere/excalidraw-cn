export {
  createBoardInStorage,
  getBoardListFromStorage,
  getCurrentBoardName,
  getWorkspaceStateSnapshot,
  removeBoardFromStorage,
  renameBoardNameInStorage,
  requireElectronApi,
  resetWorkspaceStateCache,
  selectBoardInStorage,
  setCurrentBoardName,
} from "@workspace/state/workspaceState";

export {
  notifyWorkspaceStateChanged,
  onWorkspaceStateChanged,
} from "@workspace/state/workspaceEvents";

export type {
  WorkspaceBoardSavePayload,
  WorkspaceBoardState,
  WorkspaceBoardWritePayload,
  WorkspaceBootstrapState,
  WorkspaceSettings,
} from "@workspace/state/workspaceState";
