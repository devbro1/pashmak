#!/usr/bin/env node

import { Cli } from "clipanion";

const [node, app, ...args] = process.argv;
let cli = new Cli({
  binaryLabel: `Pashmak CLI`,
  binaryName: `${node} ${app}`,
  binaryVersion: `1.0.0`,
});

import { CreateProjectCommand } from "../app/console/project/CreateProjectCommand";

cli.register(CreateProjectCommand);

cli
  .runExit(args)
  .then(() => {})
  .catch((err: any) => {
    console.error(err);
  });
