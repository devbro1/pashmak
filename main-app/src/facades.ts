import { Router } from "neko-router/src";
import { Scheduler } from "neko-scheduler/src";
import { createSingleton } from "neko-helper/src/patternEnforcer";

export const router = createSingleton(() => new Router());
export const scheduler = createSingleton(() => new Scheduler());
