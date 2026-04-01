let consoleErrorSpy: jest.SpyInstance<void, Parameters<typeof console.error>> | null =
  null;

const originalConsoleError = console.error.bind(console);

const shouldSuppressConsoleError = (args: unknown[]) =>
  args.some(
    (arg) =>
      typeof arg === "string" && arg.includes("not wrapped in act(...)"),
  );

export const installConsoleErrorFilter = () => {
  consoleErrorSpy?.mockRestore();
  consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation((...args: Parameters<typeof console.error>) => {
      if (shouldSuppressConsoleError(args)) {
        return;
      }

      originalConsoleError(...args);
    });

  return consoleErrorSpy;
};

export const restoreConsoleErrorFilter = () => {
  consoleErrorSpy?.mockRestore();
  consoleErrorSpy = null;
};
