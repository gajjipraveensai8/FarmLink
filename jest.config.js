export default {
  testEnvironment: "node",
  transform: {},
  globalSetup: "<rootDir>/tests/globalSetup.js",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
};
