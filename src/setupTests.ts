import "@testing-library/jest-dom";
import "jest-canvas-mock";
import dotenv from "dotenv";
import polyfill from "./polyfill";
import { resetDesktopStateCache } from "./excalidraw-app/data/desktopState";
import { desktopApiMock, resetDesktopTestState } from "./tests/desktopTestState";
import {
  installConsoleErrorFilter,
  restoreConsoleErrorFilter,
} from "./tests/consoleFilters";

polyfill();
// jest doesn't know of .env.development so we need to init it ourselves
dotenv.config({
  path: require("path").resolve(__dirname, "../.env.development"),
});

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
  window.handrawDesktop = desktopApiMock as typeof window.handrawDesktop;
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
