import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    perf: "error",
    suspicious: "error",
  },
  env: {
    es2022: true,
    node: true,
    "shared-node-browser": true,
  },
  globals: {
    Bun: "readonly",
  },
  ignorePatterns: [".turbo/**", "dist/**", "node_modules/**"],
  options: {
    maxWarnings: 0,
    reportUnusedDisableDirectives: "error",
  },
  plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "node", "promise"],
});
