import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/core/index.ts", "src/cli/index.ts"],
  clean: true,
  dts: true,
  deps: {
    onlyBundle: false,
  },
});
