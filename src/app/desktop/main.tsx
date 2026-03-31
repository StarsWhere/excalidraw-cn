import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ExcalidrawApp from "./shell/DesktopApp";
import {
  bootstrapDesktopState,
  requireDesktopApi,
} from "./state/desktopState";

window.__EXCALIDRAW_SHA__ = process.env.REACT_APP_GIT_SHA;

const mount = async () => {
  requireDesktopApi();
  await bootstrapDesktopState();
  const rootElement = document.getElementById("root")!;
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ExcalidrawApp />
    </StrictMode>,
  );
};

void mount();
