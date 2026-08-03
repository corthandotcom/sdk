module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/tests/**/*.test.(ts|tsx)"],
  moduleNameMapper: {
    "^react$": "<rootDir>/../../node_modules/react",
    "^react-dom$": "<rootDir>/../../node_modules/react-dom",
    "^(\\.\\.?\\/.+)\\.js$": "$1"
  }
};
