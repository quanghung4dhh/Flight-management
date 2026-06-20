import { defineConfig } from "vitest/config";
import path from "path";

const __dirname = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      db: path.resolve(__dirname, "./db"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts", "test/**/*.spec.ts"],
    setupFiles: ["test/api/setup.ts"],
    globals: true,
  },
});
