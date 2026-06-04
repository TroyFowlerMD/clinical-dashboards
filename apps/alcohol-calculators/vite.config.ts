import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "../../alcohol-calculators"),
    emptyOutDir: true
  },
  test: {
    environment: "node"
  }
});
