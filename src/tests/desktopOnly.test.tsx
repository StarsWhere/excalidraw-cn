import {
  fireEvent,
  queryByTestId,
  queryByText,
  render,
  toggleMenu,
} from "./test-utils";
import ExcalidrawApp from "../excalidraw-app";
import { t } from "../i18n";
import {
  bootstrapDesktopState,
  resetDesktopStateCache,
} from "../excalidraw-app/data/desktopState";

describe("desktop-only app", () => {
  beforeEach(() => {
    resetDesktopStateCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fails fast when the Electron preload bridge is missing", async () => {
    const originalDesktop = window.handrawDesktop;
    delete (window as Partial<Window>).handrawDesktop;

    await expect(bootstrapDesktopState()).rejects.toThrow(
      "Handraw must run inside the Electron desktop shell",
    );

    window.handrawDesktop = originalDesktop;
  });

  it("renders only desktop export actions", async () => {
    const { container } = await render(<ExcalidrawApp />);

    toggleMenu(container);
    fireEvent.click(queryByTestId(container, "json-export-button")!);

    expect(
      queryByText(document.body, t("exportDialog.disk_button")),
    ).toBeTruthy();
    expect(
      queryByText(document.body, t("exportDialog.link_button")),
    ).toBeNull();
    expect(
      queryByText(document.body, t("exportDialog.excalidrawplus_button")),
    ).toBeNull();
  });

  it("renders only desktop library management actions", async () => {
    const { container } = await render(<ExcalidrawApp />);

    fireEvent.click(container.querySelector(".library-button")!);
    fireEvent.click(container.querySelector(".Sidebar__dropdown-btn")!);

    expect(queryByTestId(container, "lib-dropdown--load")).toBeTruthy();
    expect(queryByText(container, t("buttons.publishLibrary"))).toBeNull();
    expect(container.querySelector(".library-menu-browse-button")).toBeNull();
    expect(
      queryByText(container, t("library.hint_emptyPrivateLibrary")),
    ).toBeTruthy();
  });

  it("renders help without external links", async () => {
    const { container } = await render(<ExcalidrawApp />);

    toggleMenu(container);
    fireEvent.click(queryByTestId(container, "help-menu-item")!);

    const helpDialog = document.querySelector(".HelpDialog");

    expect(helpDialog).toBeTruthy();
    expect(helpDialog?.querySelector("a")).toBeNull();
  });
});
