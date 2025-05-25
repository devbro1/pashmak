import { Router } from "neko-router/src";
import { Scheduler } from "neko-scheduler/src";
import { createSingleton } from "neko-helper/src/patternEnforcer";
import { ctx } from "neko-helper/src/context";
import { Connection } from "neko-sql/src/Connection";

export const router = createSingleton(() => new Router());
export const scheduler = createSingleton(() => new Scheduler());
export const db = (label = "default") =>
  ctx().getOrThrow<Connection>(["database", label]);
