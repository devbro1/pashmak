import { Router } from "neko-router/src";
import { Scheduler } from "neko-scheduler/src";
import { createSingleton } from "neko-helper/src/patternEnforcer";
import { ctx } from "neko-helper/src/context";
import { Connection } from "neko-sql/src/Connection";
import { StorageFactory } from "neko-storage/src/";
import config from "config";

export const router = createSingleton(() => new Router());
export const scheduler = createSingleton(() => new Scheduler());
export const db = (label = "default") =>
  ctx().getOrThrow<Connection>(["database", label]);

export const storage = createSingleton((label: string = "default") =>
  StorageFactory.create(config.get(["storages", label].join("."))),
);
