import {
  DistributeHorizontallyIcon,
  DistributeVerticallyIcon,
} from "../components/icons";
import { ToolButton } from "../components/ToolButton";
import { distributeElements, Distribution } from "../features/distribute";
import { getNonDeletedElements } from "../elements";
import { ExcalidrawElement } from "../elements/types";
import { t } from "../../../shared/i18n";
import { CODES, KEYS } from "../../../shared/lib/keys";
import { getSelectedElements, isSomeElementSelected } from "../scene";
import { AppState } from "../state/types";
import { arrayToMap, getShortcutKey } from "../../../shared/lib/utils";
import { register } from "./register";

const enableActionGroup = (
  elements: readonly ExcalidrawElement[],
  appState: AppState,
) => getSelectedElements(getNonDeletedElements(elements), appState).length > 1;

const distributeSelectedElements = (
  elements: readonly ExcalidrawElement[],
  appState: Readonly<AppState>,
  distribution: Distribution,
) => {
  const selectedElements = getSelectedElements(
    getNonDeletedElements(elements),
    appState,
  );

  const updatedElements = distributeElements(selectedElements, distribution);

  const updatedElementsMap = arrayToMap(updatedElements);

  return elements.map(
    (element) => updatedElementsMap.get(element.id) || element,
  );
};

export const distributeHorizontally = register({
  name: "distributeHorizontally",
  trackEvent: { category: "element" },
  perform: (elements, appState) => {
    return {
      appState,
      elements: distributeSelectedElements(elements, appState, {
        space: "between",
        axis: "x",
      }),
      commitToHistory: true,
    };
  },
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.H,
  PanelComponent: ({ elements, appState, updateData }) => (
    <ToolButton
      hidden={!enableActionGroup(elements, appState)}
      type="button"
      icon={DistributeHorizontallyIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.distributeHorizontally")} — ${getShortcutKey(
        "Alt+H",
      )}`}
      aria-label={t("labels.distributeHorizontally")}
      visible={isSomeElementSelected(getNonDeletedElements(elements), appState)}
    />
  ),
});

export const distributeVertically = register({
  name: "distributeVertically",
  trackEvent: { category: "element" },
  perform: (elements, appState) => {
    return {
      appState,
      elements: distributeSelectedElements(elements, appState, {
        space: "between",
        axis: "y",
      }),
      commitToHistory: true,
    };
  },
  keyTest: (event) =>
    !event[KEYS.CTRL_OR_CMD] && event.altKey && event.code === CODES.V,
  PanelComponent: ({ elements, appState, updateData }) => (
    <ToolButton
      hidden={!enableActionGroup(elements, appState)}
      type="button"
      icon={DistributeVerticallyIcon}
      onClick={() => updateData(null)}
      title={`${t("labels.distributeVertically")} — ${getShortcutKey("Alt+V")}`}
      aria-label={t("labels.distributeVertically")}
      visible={isSomeElementSelected(getNonDeletedElements(elements), appState)}
    />
  ),
});
