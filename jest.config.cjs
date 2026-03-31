module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setupTests.ts"],
  snapshotResolver: "<rootDir>/scripts/test/jest/snapshotResolver.cjs",
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp|bmp|ico|woff2?)$":
      "<rootDir>/scripts/test/jest/fileMock.cjs",
    "^@app/(.*)$": "<rootDir>/src/app/$1",
    "^@core/(.*)$": "<rootDir>/src/core/$1",
    "^@platform/(.*)$": "<rootDir>/src/platform/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@test/(.*)$": "<rootDir>/src/test/$1",
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
