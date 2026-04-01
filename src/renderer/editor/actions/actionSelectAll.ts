import { KEYS } from "@shared/lib/keys";
import { register } from "./register";
import { selectGroupsForSelectedElements } from "@editor/features/groups";
import { getNonDeletedElements, isTextElement } from "../elements";
import { ExcalidrawElement } from "../elements/types";
import { isLinearElement } from "../elements/typeChecks";
import { LinearElementEditor } from "../elements/linearElementEditor";

export const actionSelectAll = register({
  name: "selectAll",
  trackEvent: { category: "canvas" },
  perform: (elements, appState, value, app) => {
    if (appState.editingLinearElement) {
      return false;
    }
    const selectedElementIds = elements.reduce(
      (map: Record<ExcalidrawElement["id"], true>, element) => {
        if (
          !element.isDeleted &&
          !(isTextElement(element) && element.containerId) &&
          !element.locked
        ) {
          map[element.id] = true;
        }
        return map;
      },
      {},
    );

    return {
      appState: selectGroupsForSelectedElements(
        {
          ...appState,
          selectedLinearElement:
            // single linear element selected
            Object.keys(selectedElementIds).length === 1 &&
            isLinearElement(elements[0])
              ? new LinearElementEditor(elements[0], app.scene)
              : null,
          editingGroupId: null,
          selectedElementIds,
        },
        getNonDeletedElements(elements),
      ),
      commitToHistory: true,
    };
  },
  contextItemLabel: "labels.selectAll",
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] && event.key === KEYS.A,
});
