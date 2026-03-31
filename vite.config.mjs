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
      "@app": path.resolve("src/app"),
      "@core": path.resolve("src/core"),
      "@platform": path.resolve("src/platform"),
      "@shared": path.resolve("src/shared"),
      "@test": path.resolve("src/test"),
    },
  },
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
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
