import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const allSourceFiles = ["**/*.{js,cjs,mjs,ts,tsx}"];
const browserFiles = ["src/**/*.{js,ts,tsx}"];
const nodeFiles = [
  "*.cjs",
  ".lintstagedrc.js",
  "src/main/**/*.{js,cjs}",
  "src/preload/**/*.{js,cjs}",
  "scripts/**/*.{js,cjs}",
];
const testFiles = [
  "**/*.test.{js,ts,tsx}",
  "jest.config.cjs",
  "test/**/*.{js,ts,tsx}",
];

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "coverage/**",
      ".vscode/**",
      "firebase/**",
      "package-lock.json",
      "public/runtime-static/**",
      "src/packages/excalidraw/types/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: allSourceFiles,
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-console": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
    },
  },
  {
    files: browserFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        process: "readonly",
      },
    },
  },
  {
    files: nodeFiles,
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: testFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
        process: "readonly",
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
    },
  },
  {
    files: ["src/renderer/editor/**/*.{ts,tsx,js,jsx}"],
    ignores: ["**/*.test.*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@workspace/*",
            "@renderer/platform/electron/*",
          ],
        },
      ],
    },
  },
);
