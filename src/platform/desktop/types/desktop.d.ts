import type { HandrawDesktopApi } from "../api/handrawDesktop";

declare global {
  interface Window {
    handrawDesktop: HandrawDesktopApi;
  }
}

export {};
