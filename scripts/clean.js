import fs from "node:fs";
import path from "node:path";

for (const dir of fs.readdirSync("integration", { withFileTypes: true })) {
  if (dir.isDirectory())
    fs.rmSync(path.join("integration", dir.name, "openapi.json"), {
      force: true,
    });
}
