import dotenv from "dotenv";
dotenv.config();

process.env["NODE_CONFIG_DIR"] = __dirname + "/config/";
import config from "config";

import { HttpServer } from "neko-http/src";
import { HttpError } from "http-errors";
import { router, scheduler } from "./facades";
import { Command, Option, runExit, Cli } from "clipanion";
import * as commands from "./app/console";

import "./routes";
import "./schedules";

const [node, app, ...args] = process.argv;
const cli = new Cli({
  binaryLabel: `My Application`,
  binaryName: `${node} ${app}`,
  binaryVersion: `1.0.0`,
});

// @ts-ignore
for (const [, command] of Object.entries(commands)) {
  cli.register(command);
}
cli.runExit(args);
