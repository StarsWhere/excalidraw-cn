import { isSomeElementSelected } from "../scene";
import { KEYS } from "../../../shared/lib/keys";
import { ToolButton } from "../components/ToolButton";
import { t } from "../../../shared/i18n";
import { register } from "./register";
import { getNonDeletedElements } from "../elements";
import { ExcalidrawElement } from "../elements/types";
import { AppState } from "../state/types";
import { newElementWith } from "../elements/mutateElement";
import { getElementsInGroup } from "../features/groups";
import { LinearElementEditor } from "../elements/linearElementEditor";
import { fixBindingsAfterDeletion } from "../elements/binding";
import { isBoundToContainer } from "../elements/typeChecks";
import { updateActiveTool } from "../../../shared/lib/utils";
import { TrashIcon } from "../components/icons";

const deleteSelectedElements = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => {
  return {
    elements: elements.map((el) => {
      if (appState.selectedElementIds[el.id]) {
        return newElementWith(el, { isDeleted: true });
      }
      if (
        isBoundToContainer(el) &&
        appState.selectedElementIds[el.containerId]
      ) {
        return newElementWith(el, { isDeleted: true });
      }
      return el;
    }),
    appState: {
      ...appState,
      selectedElementIds: {},
    },
  };
};

const handleGroupEditingState = (
  appState: AppState,
  elements: readonly ExcalidrawElement[],
): AppState => {
  if (appState.editingGroupId) {
    const siblingElements = getElementsInGroup(
      getNonDeletedElements(elements),
      appState.editingGroupId!,
    );
    if (siblingElements.length) {
      return {
        ...appState,
        selectedElementIds: { [siblingElements[0].id]: true },
      };
    }
  }
  return appState;
};

export const actionDeleteSelected = register({
  name: "deleteSelectedElements",
  trackEvent: { category: "element", action: "delete" },
  perform: (elements, appState) => {
    if (appState.editingLinearElement) {
      const {
        elementId,
        selectedPointsIndices,
        startBindingElement,
        endBindingElement,
      } = appState.editingLinearElement;
      const element = LinearElementEditor.getElement(elementId);
      if (!element) {
        return false;
      }
      // case: no point selected → do nothing, as deleting the whole element
      // is most likely a mistake, where you wanted to delete a specific point
      // but failed to select it (or you thought it's selected, while it was
      // only in a hover state)
      if (selectedPointsIndices == null) {
        return false;
      }

      // case: deleting last remaining point
      if (element.points.length < 2) {
        const nextElements = elements.map((el) => {
          if (el.id === element.id) {
            return newElementWith(el, { isDeleted: true });
          }
          return el;
        });
        const nextAppState = handleGroupEditingState(appState, nextElements);

        return {
          elements: nextElements,
          appState: {
            ...nextAppState,
            editingLinearElement: null,
          },
          commitToHistory: false,
        };
      }

      // We cannot do this inside `movePoint` because it is also called
      // when deleting the uncommitted point (which hasn't caused any binding)
      const binding = {
        startBindingElement: selectedPointsIndices?.includes(0)
          ? null
          : startBindingElement,
        endBindingElement: selectedPointsIndices?.includes(
          element.points.length - 1,
        )
          ? null
          : endBindingElement,
      };

      LinearElementEditor.deletePoints(element, selectedPointsIndices);

      return {
        elements,
        appState: {
          ...appState,
          editingLinearElement: {
            ...appState.editingLinearElement,
            ...binding,
            selectedPointsIndices:
              selectedPointsIndices?.[0] > 0
                ? [selectedPointsIndices[0] - 1]
                : [0],
          },
        },
        commitToHistory: true,
      };
    }
    const {
      elements: nextElements,
      appState: deletedAppState,
    } = deleteSelectedElements(elements, appState);
    fixBindingsAfterDeletion(
      nextElements,
      elements.filter(({ id }) => appState.selectedElementIds[id]),
    );

    const nextAppState = handleGroupEditingState(deletedAppState, nextElements);

    return {
      elements: nextElements,
      appState: {
        ...nextAppState,
        activeTool: updateActiveTool(appState, { type: "selection" }),
        multiElement: null,
      },
      commitToHistory: isSomeElementSelected(
        getNonDeletedElements(elements),
        appState,
      ),
    };
  },
  contextItemLabel: "labels.delete",
  keyTest: (event) => event.key === KEYS.BACKSPACE || event.key === KEYS.DELETE,
  PanelComponent: ({ elements, appState, updateData }) => (
    <ToolButton
      type="button"
      icon={TrashIcon}
      title={t("labels.delete")}
      aria-label={t("labels.delete")}
      onClick={() => updateData(null)}
      visible={isSomeElementSelected(getNonDeletedElements(elements), appState)}
    />
  ),
});
