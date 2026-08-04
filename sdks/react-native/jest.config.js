module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.(ts|tsx)"],
  moduleNameMapper: {
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
    "^react-test-renderer$": "<rootDir>/node_modules/react-test-renderer",
    "^(\\.\\.?\\/.+)\\.js$": "$1"
  }
};
