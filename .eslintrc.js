module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "off",
  },
  overrides: [
    {
      files: ["*.test.ts", "*.spec.js"],
      rules: {
        "no-unused-expressions": "off",
        "@typescript-eslint/ban-ts-comment": "off",
      },
    },
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "prettier/@typescript-eslint",
  ],
};
