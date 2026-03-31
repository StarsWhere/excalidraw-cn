import "pepjs";

import {
  render,
  queries,
  RenderResult,
  RenderOptions,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";

import * as toolQueries from "../integration/queries/toolQueries";
import { ImportedDataState } from "../../core/editor/io/types";
import {
  bootstrapDesktopState,
  resetDesktopStateCache,
} from "../../app/desktop/state/desktopState";

import { SceneData } from "../../core/editor/state/types";
import { getSelectedElements } from "../../core/editor/scene/selection";
import { ExcalidrawElement } from "../../core/editor/elements/types";
import { setDesktopDraftState } from "./desktopTestState";

const customQueries = {
  ...queries,
  ...toolQueries,
};

const ACT_WRAPPED = Symbol("actWrapped");

const wrapMethodWithAct = <
  T extends Record<string, any>,
  K extends keyof T & string,
>(
  target: T | undefined,
  key: K,
) => {
  const original = target?.[key];
  if (typeof original !== "function" || (original as any)[ACT_WRAPPED]) {
    return;
  }

  const wrapped = (...args: Parameters<typeof original>) => {
    let result: ReturnType<typeof original>;
    act(() => {
      result = original.apply(target, args);
    });
    return result!;
  };

  Object.defineProperty(wrapped, ACT_WRAPPED, {
    value: true,
  });

  Object.defineProperty(target, key, {
    configurable: true,
    value: wrapped,
  });
};

const wrapDesktopTestApisWithAct = () => {
  wrapMethodWithAct(window.h as any, "setState");
  wrapMethodWithAct(window.h?.app as any, "setState");
  wrapMethodWithAct(window.h?.app as any, "setAppState");
  wrapMethodWithAct(window.h?.app as any, "refresh");
  wrapMethodWithAct(window.h?.app as any, "refreshDeviceState");
};

type TestRenderFn = (
  ui: React.ReactElement,
  options?: Omit<
    RenderOptions & { desktopStateData?: ImportedDataState },
    "queries"
  >,
) => Promise<RenderResult<typeof customQueries>>;

const renderApp: TestRenderFn = async (ui, options) => {
  if (options?.desktopStateData) {
    await initDesktopState(options.desktopStateData);
    delete options.desktopStateData;
  }

  const renderResult = render(ui, {
    queries: customQueries,
    ...options,
  });

  GlobalTestState.renderResult = renderResult;

  Object.defineProperty(GlobalTestState, "canvas", {
    // must be a getter because at the time of ExcalidrawApp render the
    // child App component isn't likely mounted yet (and thus canvas not
    // present in DOM)
    get() {
      return renderResult.container.querySelector("canvas")!;
    },
  });

  await waitFor(() => {
    const canvas = renderResult.container.querySelector("canvas");
    if (!canvas) {
      throw new Error("not initialized yet");
    }
  });

  await waitFor(() => {
    if (!window.h?.state || window.h.state.isLoading) {
      throw new Error("app state not ready yet");
    }
  });

  await act(async () => {});
  wrapDesktopTestApisWithAct();

  return renderResult;
};

// re-export everything
export * from "@testing-library/react";

// override render method
export { renderApp as render };

/**
 * For state-sharing across test helpers.
 * NOTE: there shouldn't be concurrency issues as each test is running in its
 *  own process and thus gets its own instance of this module when running
 *  tests in parallel.
 */
export class GlobalTestState {
  /**
   * automatically updated on each call to render()
   */
  static renderResult: RenderResult<typeof customQueries> = null!;
  /**
   * retrieves canvas for currently rendered app instance
   */
  static get canvas(): HTMLCanvasElement {
    return null!;
  }
}

const initDesktopState = async (data: ImportedDataState) => {
  setDesktopDraftState(data);
  resetDesktopStateCache();
  await bootstrapDesktopState();
};

export const updateSceneData = (data: SceneData) => {
  act(() => {
    (window.h.app as any).excalidrawAPI.updateScene(data);
  });
};

const originalGetBoundingClientRect =
  global.window.HTMLDivElement.prototype.getBoundingClientRect;

export const mockBoundingClientRect = (
  {
    top = 0,
    left = 0,
    bottom = 0,
    right = 0,
    width = 1920,
    height = 1080,
    x = 0,
    y = 0,
    toJSON = () => {},
  } = {
    top: 10,
    left: 20,
    bottom: 10,
    right: 10,
    width: 200,
    x: 10,
    y: 20,
    height: 100,
  },
) => {
  // override getBoundingClientRect as by default it will always return all values as 0 even if customized in html
  global.window.HTMLDivElement.prototype.getBoundingClientRect = () => ({
    top,
    left,
    bottom,
    right,
    width,
    height,
    x,
    y,
    toJSON,
  });
};

export const withExcalidrawDimensions = async (
  dimensions: { width: number; height: number },
  cb: () => void,
) => {
  mockBoundingClientRect(dimensions);
  // @ts-ignore
  window.h.app.refreshDeviceState(h.app.excalidrawContainerRef.current!);
  window.h.app.refresh();

  await cb();

  restoreOriginalGetBoundingClientRect();
  // @ts-ignore
  window.h.app.refreshDeviceState(h.app.excalidrawContainerRef.current!);
  window.h.app.refresh();
};

export const restoreOriginalGetBoundingClientRect = () => {
  global.window.HTMLDivElement.prototype.getBoundingClientRect =
    originalGetBoundingClientRect;
};

export const assertSelectedElements = (
  ...elements: (
    | (ExcalidrawElement["id"] | ExcalidrawElement)[]
    | ExcalidrawElement["id"]
    | ExcalidrawElement
  )[]
) => {
  const { h } = window;
  const selectedElementIds = getSelectedElements(
    h.app.getSceneElements(),
    h.state,
  ).map((el) => el.id);
  const ids = elements
    .flat()
    .map((item) => (typeof item === "string" ? item : item.id));
  expect(selectedElementIds.length).toBe(ids.length);
  expect(selectedElementIds).toEqual(expect.arrayContaining(ids));
};

export const toggleMenu = (container: HTMLElement) => {
  // open menu
  fireEvent.click(container.querySelector(".dropdown-menu-button")!);
};
