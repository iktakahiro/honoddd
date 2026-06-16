import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [".turbo/**", ".vscode/**", "dist/**", "node_modules/**"],
  printWidth: 100,
});
