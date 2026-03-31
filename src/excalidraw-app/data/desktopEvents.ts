const DESKTOP_STATE_CHANGED_EVENT = "handraw:desktop-state-changed";

export const notifyDesktopStateChanged = () => {
  window.dispatchEvent(new CustomEvent(DESKTOP_STATE_CHANGED_EVENT));
};

export const onDesktopStateChanged = (listener: () => void) => {
  window.addEventListener(DESKTOP_STATE_CHANGED_EVENT, listener);
  return () => {
    window.removeEventListener(DESKTOP_STATE_CHANGED_EVENT, listener);
  };
};
