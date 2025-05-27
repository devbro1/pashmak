import { Router } from "neko-router/src";
import { Scheduler } from "neko-scheduler/src";
import { createSingleton } from "neko-helper/src/patternEnforcer";
import { ctx } from "neko-helper/src/context";
import { Connection } from "neko-sql/src/Connection";
import { Storage, StorageFactory } from "neko-storage/src/";
import config from "config";
import { Command, Option, runExit, Cli } from "clipanion";

export const router = createSingleton<Router>(() => new Router());
export const scheduler = createSingleton<Scheduler>(() => new Scheduler());
export const db = (label = "default") =>
  ctx().getOrThrow<Connection>(["database", label]);

export const storage = createSingleton<Storage>((label: string = "default") =>
  StorageFactory.create(config.get(["storages", label].join("."))),
);

export const cli = createSingleton<Cli>(() => {
  const [node, app, ...args] = process.argv;
  return new Cli({
    binaryLabel: `My Application`,
    binaryName: `${node} ${app}`,
    binaryVersion: `1.0.0`,
  });
});
