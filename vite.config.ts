/// <reference types="vitest/config" />
import { defineConfig, type UserConfig } from "vite";

const config: UserConfig = defineConfig({
  test: {
    includeSource: ["src/**/*.?(c|m)[jt]s?(x)"],
    benchmark: {
      includeSource: ["src/**/*.?(c|m)[jt]s?(x)"],
    },
  },
  define: {
    "import.meta.vitest": "undefined",
  },
});
export { config as default };
