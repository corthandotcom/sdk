module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/tests/**/*.test.(ts|tsx)"],
  moduleNameMapper: {
    "^(\\.\\.?\\/.+)\\.js$": "$1"
  }
};
