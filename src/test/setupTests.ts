import "@testing-library/jest-dom";
import "jest-canvas-mock";
import polyfill from "../shared/lib/polyfill";
import { resetDesktopStateCache } from "../app/desktop/state/desktopState";
import { desktopApiMock, resetDesktopTestState } from "./helpers/desktopTestState";
import {
  installConsoleErrorFilter,
  restoreConsoleErrorFilter,
} from "./helpers/consoleFilters";
import { setHandrawDesktopApiForTests } from "../platform/desktop/api/handrawDesktop";

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
  resetDesktopTestState();
  resetDesktopStateCache();
  setHandrawDesktopApiForTests(desktopApiMock);
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
