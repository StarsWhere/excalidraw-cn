import {
  fireEvent,
  queryByTestId,
  queryByText,
  render,
  toggleMenu,
  waitFor,
} from "./test-utils";
import ExcalidrawApp from "../excalidraw-app";
import { t } from "../i18n";

describe("local-only app", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    (globalThis as any).fetch = jest.fn();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalFetch) {
      (globalThis as any).fetch = originalFetch;
    } else {
      delete (globalThis as any).fetch;
    }
    window.history.replaceState({}, "", "/");
    jest.restoreAllMocks();
  });

  it.each([
    "/#room=abc,def",
    "/#json=https://example.com/scene",
    "/#url=https://example.com/scene",
  ])(
    "does not fetch unsupported remote scene links on startup: %s",
    async (url) => {
      window.history.replaceState({}, "", url);

      await render(<ExcalidrawApp />);

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(window.location.search).toBe("");
      expect(window.location.hash).toBe("");
      expect(console.warn).toHaveBeenCalled();
    },
  );

  it.each([
    "/?addLibrary=https%3A%2F%2Fexample.com%2Flib.excalidrawlib",
    "/#addLibrary=https%3A%2F%2Fexample.com%2Flib.excalidrawlib&token=abc",
  ])(
    "does not fetch unsupported remote library links on startup: %s",
    async (url) => {
      window.history.replaceState({}, "", url);

      await render(<ExcalidrawApp />);

      expect(globalThis.fetch).not.toHaveBeenCalled();
      expect(window.location.search).toBe("");
      expect(window.location.hash).toBe("");
      expect(console.warn).toHaveBeenCalled();
    },
  );

  it("does not fetch unsupported remote scene links after hash changes", async () => {
    await render(<ExcalidrawApp />);

    window.history.pushState({}, "", "/#room=next-room,token");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => {
      expect(window.location.hash).toBe("");
    });

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  it("renders only local export actions", async () => {
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

  it("renders only local library management actions", async () => {
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
