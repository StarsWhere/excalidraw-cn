const WORKSPACE_STATE_CHANGED_EVENT = "handraw:workspace-state-changed";

export const notifyWorkspaceStateChanged = () => {
  window.dispatchEvent(new CustomEvent(WORKSPACE_STATE_CHANGED_EVENT));
};

export const onWorkspaceStateChanged = (listener: () => void) => {
  window.addEventListener(WORKSPACE_STATE_CHANGED_EVENT, listener);
  return () => {
    window.removeEventListener(WORKSPACE_STATE_CHANGED_EVENT, listener);
  };
};
