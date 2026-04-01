import { Action, ActionResult } from "./types";
import { UndoIcon, RedoIcon } from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { t } from "@shared/i18n";
import History, { HistoryEntry } from "../state/history";
import { ExcalidrawElement } from "../elements/types";
import { AppState } from "../state/types";
import { KEYS } from "@shared/lib/keys";
import { newElementWith } from "../elements/mutateElement";
import { fixBindingsAfterDeletion } from "../elements/binding";
import { arrayToMap } from "@shared/lib/utils";
import { isWindows } from "../state/constants";

const writeData = (
  prevElements: readonly ExcalidrawElement[],
  appState: AppState,
  updater: () => HistoryEntry | null,
): ActionResult => {
  const commitToHistory = false;
  if (
    !appState.multiElement &&
    !appState.resizingElement &&
    !appState.editingElement &&
    !appState.draggingElement
  ) {
    const data = updater();
    if (data === null) {
      return { commitToHistory };
    }

    const prevElementMap = arrayToMap(prevElements);
    const nextElements = data.elements;
    const nextElementMap = arrayToMap(nextElements);

    const deletedElements = prevElements.filter(
      (prevElement) => !nextElementMap.has(prevElement.id),
    );
    const elements = nextElements
      .map((nextElement) =>
        newElementWith(
          prevElementMap.get(nextElement.id) || nextElement,
          nextElement,
        ),
      )
      .concat(
        deletedElements.map((prevElement) =>
          newElementWith(prevElement, { isDeleted: true }),
        ),
      );
    fixBindingsAfterDeletion(elements, deletedElements);

    return {
      elements,
      appState: { ...appState, ...data.appState },
      commitToHistory,
      syncHistory: true,
    };
  }
  return { commitToHistory };
};

type ActionCreator = (history: History) => Action;

export const createUndoAction: ActionCreator = (history) => ({
  name: "undo",
  trackEvent: { category: "history" },
  perform: (elements, appState) =>
    writeData(elements, appState, () => history.undoOnce()),
  keyTest: (event) =>
    event[KEYS.CTRL_OR_CMD] &&
    event.key.toLowerCase() === KEYS.Z &&
    !event.shiftKey,
  PanelComponent: ({ updateData, data }) => (
    <ToolButton
      type="button"
      icon={UndoIcon}
      aria-label={t("buttons.undo")}
      onClick={updateData}
      size={data?.size || "medium"}
    />
  ),
  commitToHistory: () => false,
});

export const createRedoAction: ActionCreator = (history) => ({
  name: "redo",
  trackEvent: { category: "history" },
  perform: (elements, appState) =>
    writeData(elements, appState, () => history.redoOnce()),
  keyTest: (event) =>
    (event[KEYS.CTRL_OR_CMD] &&
      event.shiftKey &&
      event.key.toLowerCase() === KEYS.Z) ||
    (isWindows && event.ctrlKey && !event.shiftKey && event.key === KEYS.Y),
  PanelComponent: ({ updateData, data }) => (
    <ToolButton
      type="button"
      icon={RedoIcon}
      aria-label={t("buttons.redo")}
      onClick={updateData}
      size={data?.size || "medium"}
    />
  ),
  commitToHistory: () => false,
});
