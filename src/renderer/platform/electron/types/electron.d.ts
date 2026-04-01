import type { HandrawElectronApi } from "../api/handrawElectron";

declare global {
  interface Window {
    handrawElectron: HandrawElectronApi;
  }
}

export {};
