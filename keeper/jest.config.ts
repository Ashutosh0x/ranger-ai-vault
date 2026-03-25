import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: "tsconfig.json" },
    ],
  },
  testTimeout: 30000,
  moduleNameMapper: {
    "^@drift-labs/sdk$": "<rootDir>/tests/__mocks__/drift-sdk.ts",
    "^@voltr/vault-sdk$": "<rootDir>/tests/__mocks__/voltr-sdk.ts",
  },
};

export default config;
