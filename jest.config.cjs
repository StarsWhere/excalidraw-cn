module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp|bmp|ico|woff2?)$":
      "<rootDir>/scripts/jest/fileMock.cjs",
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
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/src/packages/"],
};
