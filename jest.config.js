module.exports = {
  preset: "ts-jest/presets/js-with-babel",
  testEnvironment: "node",
  testRegex: ["\\.test\\.ts$"],
  globals: {
    "ts-jest": {
      babelConfig: true,
    },
  },
};
