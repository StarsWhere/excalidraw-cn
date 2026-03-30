import { NonDeletedExcalidrawElement } from "../../element/types";
import * as exportUtils from "../../scene/export";
import {
  diamondFixture,
  ellipseFixture,
  rectangleWithLinkFixture,
} from "../fixtures/elementFixture";

describe("exportToSvg", () => {
  window.EXCALIDRAW_ASSET_PATH = "/";
  const ELEMENT_HEIGHT = 100;
  const ELEMENT_WIDTH = 100;
  const ELEMENTS = [
    { ...diamondFixture, height: ELEMENT_HEIGHT, width: ELEMENT_WIDTH },
    { ...ellipseFixture, height: ELEMENT_HEIGHT, width: ELEMENT_WIDTH },
  ] as NonDeletedExcalidrawElement[];

  const DEFAULT_OPTIONS = {
    exportBackground: false,
    viewBackgroundColor: "#ffffff",
    files: {},
  };

  it("with default arguments", async () => {
    const svgElement = await exportUtils.exportToSvg(
      ELEMENTS,
      DEFAULT_OPTIONS,
      null,
    );

    expect(svgElement.outerHTML).not.toContain("https://");
    expect(svgElement.outerHTML).toContain('src: url("./Virgil.woff2")');
    expect(svgElement).toMatchSnapshot();
  });

  it("with background color", async () => {
    const BACKGROUND_COLOR = "#abcdef";

    const svgElement = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportBackground: true,
        viewBackgroundColor: BACKGROUND_COLOR,
      },
      null,
    );

    expect(svgElement.querySelector("rect")?.getAttribute("fill")).toBe(
      BACKGROUND_COLOR,
    );
  });

  it("with dark mode", async () => {
    const svgElement = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportWithDarkMode: true,
      },
      null,
    );

    expect(svgElement.getAttribute("filter")).toMatchInlineSnapshot(
      `"themeFilter"`,
    );
  });

  it("with exportPadding", async () => {
    const svgElement = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportPadding: 0,
      },
      null,
    );

    expect(svgElement.getAttribute("height")).toBe(ELEMENT_HEIGHT.toString());
    expect(svgElement.getAttribute("width")).toBe(ELEMENT_WIDTH.toString());
    expect(svgElement.getAttribute("viewBox")).toBe(
      `0 0 ${ELEMENT_WIDTH} ${ELEMENT_HEIGHT}`,
    );
  });

  it("with scale", async () => {
    const SCALE = 2;

    const svgElement = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportPadding: 0,
        exportScale: SCALE,
      },
      null,
    );

    expect(svgElement.getAttribute("height")).toBe(
      (ELEMENT_HEIGHT * SCALE).toString(),
    );
    expect(svgElement.getAttribute("width")).toBe(
      (ELEMENT_WIDTH * SCALE).toString(),
    );
  });

  it("with exportEmbedScene", async () => {
    const svgElement = await exportUtils.exportToSvg(
      ELEMENTS,
      {
        ...DEFAULT_OPTIONS,
        exportEmbedScene: true,
      },
      null,
    );
    expect(svgElement.innerHTML).toMatchSnapshot();
  });

  it("with elements that have a link", async () => {
    const svgElement = await exportUtils.exportToSvg(
      [rectangleWithLinkFixture],
      DEFAULT_OPTIONS,
      null,
    );
    expect(svgElement.innerHTML).toMatchSnapshot();
  });
});
