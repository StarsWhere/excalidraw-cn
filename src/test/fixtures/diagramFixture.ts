import { VERSIONS } from "../../core/editor/state/constants";
import {
  diamondFixture,
  ellipseFixture,
  rectangleFixture,
} from "./elementFixture";

export const diagramFixture = {
  type: "excalidraw",
  version: VERSIONS.excalidraw,
  source: "local",
  elements: [diamondFixture, ellipseFixture, rectangleFixture],
  appState: {
    viewBackgroundColor: "#ffffff",
    gridSize: null,
  },
  files: {},
};

export const diagramFactory = ({
  overrides = {},
  elementOverrides = {},
} = {}) => ({
  ...diagramFixture,
  elements: [
    { ...diamondFixture, ...elementOverrides },
    { ...ellipseFixture, ...elementOverrides },
    { ...rectangleFixture, ...elementOverrides },
  ],
  ...overrides,
});

export default diagramFixture;
