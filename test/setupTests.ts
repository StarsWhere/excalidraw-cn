import "@testing-library/jest-dom";
import "jest-canvas-mock";
import polyfill from "@shared/lib/polyfill";
import { resetWorkspaceStateCache } from "@workspace/state/workspaceState";
import { desktopApiMock, resetWorkspaceTestState } from "./helpers/workspaceTestState";
import {
  installConsoleErrorFilter,
  restoreConsoleErrorFilter,
} from "./helpers/consoleFilters";
import { setHandrawElectronApiForTests } from "@renderer/platform/electron/api/handrawElectron";

polyfill();

jest.mock("nanoid", () => {
  return {
    nanoid: jest.fn(() => "test-id"),
  };
});
// ReactDOM is located inside index.tsx file
// as a result, we need a place for it to render into
const element = document.createElement("div");
element.id = "root";
document.body.appendChild(element);

beforeEach(() => {
  resetWorkspaceTestState();
  resetWorkspaceStateCache();
  setHandrawElectronApiForTests(desktopApiMock);
  Object.defineProperty(window, "crypto", {
    configurable: true,
    value: {
      subtle: {
        digest: async () => new ArrayBuffer(32),
      },
    },
  });
  URL.createObjectURL = jest.fn(() => "blob:mock-url");
  URL.revokeObjectURL = jest.fn();
});

installConsoleErrorFilter();

afterAll(() => {
  restoreConsoleErrorFilter();
});
