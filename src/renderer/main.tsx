import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HandrawApp from "./app/HandrawApp";
import "@shared/styles/fonts.css";
import {
  bootstrapWorkspaceState,
  requireElectronApi,
} from "./workspace/state/workspaceState";

window.__EXCALIDRAW_SHA__ = process.env.REACT_APP_GIT_SHA;

const mount = async () => {
  requireElectronApi();
  await bootstrapWorkspaceState();
  const rootElement = document.getElementById("root")!;
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <HandrawApp />
    </StrictMode>,
  );
};

void mount();
