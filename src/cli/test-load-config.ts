// cli/test-load-config.ts
// import { loadConfig } from "../src/utils/loadConfig";

import { loadConfig } from "../config/loadConfig";

loadConfig("./hono-docs.ts")
  .then((c) => console.log("Loaded config:", c))
  .catch((e) => console.error("❌", e));
