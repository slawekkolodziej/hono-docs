#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { runGenerate } from "../core";

yargs(hideBin(process.argv))
  .scriptName("hono-docs")
  .command(
    "generate",
    "Generate OpenAPI JSON",
    (y) =>
      y.option("config", {
        alias: "c",
        type: "string",
        describe: "Path to config file",
        demandOption: true,
        default: "./hono-docs.ts",
      }),
    async (argv) => {
      try {
        console.log(argv.config, "----------------");
        await runGenerate(argv.config);
      } catch (e) {
        console.error("❌", e);
        process.exit(1);
      }
    }
  )
  .demandCommand(1)
  .help()
  .parse();
