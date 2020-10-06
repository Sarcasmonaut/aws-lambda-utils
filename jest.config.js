module.exports = {
  preset: "ts-jest/presets/js-with-babel",
  testEnvironment: "node",
  testRegex: ["\\.test\\.ts$"],
  testResultsProcessor: "jest-jenkins-reporter",
  globals: {
    "ts-jest": {
      babelConfig: true,
    },
  },
};
