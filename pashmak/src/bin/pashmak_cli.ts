#!/usr/bin/env node

import { Builtins, Cli } from "clipanion";

const args = process.argv.slice(2);
const cli = new Cli({
  binaryLabel: `Pashmak CLI`,
  binaryName: `pashmak`,
  binaryVersion: `1.0.0`,
});

import { CreateProjectCommand } from "../app/console/project/CreateProjectCommand.mjs";

cli.register(Builtins.HelpCommand);
cli.register(Builtins.VersionCommand);
cli.register(CreateProjectCommand);

cli
  .runExit(args)
  .then(() => {})
  .catch((err: any) => {
    console.error("Fatal error:", err.message);
    process.exit(1);
  });
