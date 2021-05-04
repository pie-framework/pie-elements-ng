module.exports = {
  preset: "ts-jest",
  watchPathIgnorePatterns: ["docs"],
  testEnvironment: "node",
  testRegex: ".*.spec.ts",
  modulePathIgnorePatterns: ["old-stuff", "wip-src"],
};
