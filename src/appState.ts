import oc from "open-color";
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_ALIGN,
  EXPORT_SCALES,
  THEME,
} from "./constants";
import { t } from "./i18n";
import { AppState, NormalizedZoomValue } from "./types";
import { getDateTime } from "./utils";

const defaultExportScale = EXPORT_SCALES.includes(devicePixelRatio)
  ? devicePixelRatio
  : 1;

export const getDefaultAppState = (): Omit<
  AppState,
  "offsetTop" | "offsetLeft" | "width" | "height"
> => {
  return {
    showWelcomeScreen: false,
    theme: THEME.LIGHT,
    collaborators: new Map(),
    currentChartType: "bar",
    currentItemBackgroundColor: "transparent",
    currentItemEndArrowhead: "arrow",
    currentItemFillStyle: "hachure",
    currentItemFontFamily: DEFAULT_FONT_FAMILY,
    currentItemFontSize: DEFAULT_FONT_SIZE,
    currentItemOpacity: 100,
    currentItemRoughness: 1,
    currentItemStartArrowhead: null,
    currentItemStrokeColor: oc.black,
    currentItemRoundness: "round",
    currentItemStrokeStyle: "solid",
    currentItemStrokeWidth: 1,
    currentItemTextAlign: DEFAULT_TEXT_ALIGN,
    cursorButton: "up",
    draggingElement: null,
    editingElement: null,
    editingGroupId: null,
    editingLinearElement: null,
    activeTool: {
      type: "selection",
      customType: null,
      locked: false,
      lastActiveTool: null,
    },
    penMode: false,
    penDetected: false,
    errorMessage: null,
    exportBackground: true,
    exportScale: defaultExportScale,
    exportEmbedScene: false,
    exportWithDarkMode: false,
    fileHandle: null,
    gridSize: null,
    isBindingEnabled: true,
    isSidebarDocked: false,
    isLoading: false,
    isResizing: false,
    isRotating: false,
    lastPointerDownWith: "mouse",
    multiElement: null,
    name: `${t("labels.untitled")}-${getDateTime()}`,
    contextMenu: null,
    openMenu: null,
    openPopup: null,
    openSidebar: null,
    openDialog: null,
    pasteDialog: { shown: false, data: null },
    previousSelectedElementIds: {},
    resizingElement: null,
    scrolledOutside: false,
    scrollX: 0,
    scrollY: 0,
    selectedElementIds: {},
    selectedGroupIds: {},
    selectionElement: null,
    shouldCacheIgnoreZoom: false,
    showStats: false,
    startBoundElement: null,
    suggestedBindings: [],
    toast: null,
    viewBackgroundColor: oc.white,
    zenModeEnabled: false,
    zoom: {
      value: 1 as NormalizedZoomValue,
    },
    viewModeEnabled: false,
    pendingImageElementId: null,
    showHyperlinkPopup: false,
    selectedLinearElement: null,
  };
};

/**
 * Config containing all AppState keys. Used to determine whether given state
 *  prop should be stripped when exporting to given storage type.
 */
const APP_STATE_STORAGE_CONF = (<
  Values extends {
    /** whether to keep when storing to local desktop state */
    local: boolean;
    /** whether to keep when exporting to file/database */
    export: boolean;
    /** server (shareLink/collab/...) */
    server: boolean;
  },
  T extends Record<keyof AppState, Values>,
>(config: { [K in keyof T]: K extends keyof AppState ? T[K] : never }) =>
  config)({
  showWelcomeScreen: { local: true, export: false, server: false },
  theme: { local: true, export: false, server: false },
  collaborators: { local: false, export: false, server: false },
  currentChartType: { local: true, export: false, server: false },
  currentItemBackgroundColor: { local: true, export: false, server: false },
  currentItemEndArrowhead: { local: true, export: false, server: false },
  currentItemFillStyle: { local: true, export: false, server: false },
  currentItemFontFamily: { local: true, export: false, server: false },
  currentItemFontSize: { local: true, export: false, server: false },
  currentItemRoundness: {
    local: true,
    export: false,
    server: false,
  },
  currentItemOpacity: { local: true, export: false, server: false },
  currentItemRoughness: { local: true, export: false, server: false },
  currentItemStartArrowhead: { local: true, export: false, server: false },
  currentItemStrokeColor: { local: true, export: false, server: false },
  currentItemStrokeStyle: { local: true, export: false, server: false },
  currentItemStrokeWidth: { local: true, export: false, server: false },
  currentItemTextAlign: { local: true, export: false, server: false },
  cursorButton: { local: true, export: false, server: false },
  draggingElement: { local: false, export: false, server: false },
  editingElement: { local: false, export: false, server: false },
  editingGroupId: { local: true, export: false, server: false },
  editingLinearElement: { local: false, export: false, server: false },
  activeTool: { local: true, export: false, server: false },
  penMode: { local: true, export: false, server: false },
  penDetected: { local: true, export: false, server: false },
  errorMessage: { local: false, export: false, server: false },
  exportBackground: { local: true, export: false, server: false },
  exportEmbedScene: { local: true, export: false, server: false },
  exportScale: { local: true, export: false, server: false },
  exportWithDarkMode: { local: true, export: false, server: false },
  fileHandle: { local: false, export: false, server: false },
  gridSize: { local: true, export: true, server: true },
  height: { local: false, export: false, server: false },
  isBindingEnabled: { local: false, export: false, server: false },
  isSidebarDocked: { local: true, export: false, server: false },
  isLoading: { local: false, export: false, server: false },
  isResizing: { local: false, export: false, server: false },
  isRotating: { local: false, export: false, server: false },
  lastPointerDownWith: { local: true, export: false, server: false },
  multiElement: { local: false, export: false, server: false },
  name: { local: true, export: false, server: false },
  offsetLeft: { local: false, export: false, server: false },
  offsetTop: { local: false, export: false, server: false },
  contextMenu: { local: false, export: false, server: false },
  openMenu: { local: true, export: false, server: false },
  openPopup: { local: false, export: false, server: false },
  openSidebar: { local: true, export: false, server: false },
  openDialog: { local: false, export: false, server: false },
  pasteDialog: { local: false, export: false, server: false },
  previousSelectedElementIds: { local: true, export: false, server: false },
  resizingElement: { local: false, export: false, server: false },
  scrolledOutside: { local: true, export: false, server: false },
  scrollX: { local: true, export: false, server: false },
  scrollY: { local: true, export: false, server: false },
  selectedElementIds: { local: true, export: false, server: false },
  selectedGroupIds: { local: true, export: false, server: false },
  selectionElement: { local: false, export: false, server: false },
  shouldCacheIgnoreZoom: { local: true, export: false, server: false },
  showStats: { local: true, export: false, server: false },
  startBoundElement: { local: false, export: false, server: false },
  suggestedBindings: { local: false, export: false, server: false },
  toast: { local: false, export: false, server: false },
  viewBackgroundColor: { local: true, export: true, server: true },
  width: { local: false, export: false, server: false },
  zenModeEnabled: { local: true, export: false, server: false },
  zoom: { local: true, export: false, server: false },
  viewModeEnabled: { local: false, export: false, server: false },
  pendingImageElementId: { local: false, export: false, server: false },
  showHyperlinkPopup: { local: false, export: false, server: false },
  selectedLinearElement: { local: true, export: false, server: false },
});

const _clearAppStateForStorage = <
  ExportType extends "export" | "local" | "server",
>(
  appState: Partial<AppState>,
  exportType: ExportType,
) => {
  type ExportableKeys = {
    [K in keyof typeof APP_STATE_STORAGE_CONF]: typeof APP_STATE_STORAGE_CONF[K][ExportType] extends true
      ? K
      : never;
  }[keyof typeof APP_STATE_STORAGE_CONF];
  const stateForExport = {} as { [K in ExportableKeys]?: typeof appState[K] };
  for (const key of Object.keys(appState) as (keyof typeof appState)[]) {
    const propConfig = APP_STATE_STORAGE_CONF[key];
    if (propConfig?.[exportType]) {
      const nextValue = appState[key];

      // https://github.com/microsoft/TypeScript/issues/31445
      (stateForExport as any)[key] = nextValue;
    }
  }
  return stateForExport;
};

export const clearAppStateForLocalState = (appState: Partial<AppState>) => {
  return _clearAppStateForStorage(appState, "local");
};

export const cleanAppStateForExport = (appState: Partial<AppState>) => {
  return _clearAppStateForStorage(appState, "export");
};

export const clearAppStateForDatabase = (appState: Partial<AppState>) => {
  return _clearAppStateForStorage(appState, "server");
};

export const isEraserActive = ({
  activeTool,
}: {
  activeTool: AppState["activeTool"];
}) => activeTool.type === "eraser";

export const isHandToolActive = ({
  activeTool,
}: {
  activeTool: AppState["activeTool"];
}) => {
  return activeTool.type === "hand";
};
