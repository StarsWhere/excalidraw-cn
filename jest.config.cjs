module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/test/setupTests.ts"],
  snapshotResolver: "<rootDir>/scripts/test/jest/snapshotResolver.cjs",
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp|bmp|ico|woff2?)$":
      "<rootDir>/scripts/test/jest/fileMock.cjs",
    "^@main/(.*)$": "<rootDir>/src/main/$1",
    "^@preload/(.*)$": "<rootDir>/src/preload/$1",
    "^@renderer/(.*)$": "<rootDir>/src/renderer/$1",
    "^@app/(.*)$": "<rootDir>/src/renderer/app/$1",
    "^@editor/(.*)$": "<rootDir>/src/renderer/editor/$1",
    "^@workspace/(.*)$": "<rootDir>/src/renderer/workspace/$1",
    "^@shared/(.*)$": "<rootDir>/src/renderer/shared/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
  },
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        isolatedModules: true,
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!.pnpm|roughjs|points-on-curve|path-data-parser|points-on-path)",
    "node_modules/.pnpm/(?!(roughjs|points-on-curve|path-data-parser|points-on-path)@)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  resetMocks: false,
  testPathIgnorePatterns: ["/node_modules/"],
};
