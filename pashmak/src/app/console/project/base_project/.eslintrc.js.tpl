module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json", // path to your tsconfig
    tsconfigRootDir: __dirname, // optional, helps resolve from parent dir
  },
  plugins: ["@typescript-eslint"],
};
