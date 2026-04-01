import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import path from "node:path";

const getGitSha = () => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
};

export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react()],
  publicDir: "public",
  resolve: {
    alias: {
      "@main": path.resolve("src/main"),
      "@preload": path.resolve("src/preload"),
      "@renderer": path.resolve("src/renderer"),
      "@app": path.resolve("src/renderer/app"),
      "@editor": path.resolve("src/renderer/editor"),
      "@workspace": path.resolve("src/renderer/workspace"),
      "@shared": path.resolve("src/renderer/shared"),
      "@test": path.resolve("test"),
    },
  },
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");

          if (normalizedId.includes("/node_modules/")) {
            if (
              normalizedId.includes("/node_modules/react/") ||
              normalizedId.includes("/node_modules/react-dom/") ||
              normalizedId.includes("/node_modules/jotai/") ||
              normalizedId.includes("/node_modules/scheduler/")
            ) {
              return "react-vendor";
            }

            if (
              normalizedId.includes("/node_modules/roughjs/") ||
              normalizedId.includes("/node_modules/perfect-freehand/")
            ) {
              return "drawing-vendor";
            }
          }
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
    "process.env.REACT_APP_GIT_SHA": JSON.stringify(getGitSha()),
  },
}));
