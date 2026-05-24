export * from "./DefaultCommand.mjs";
export * from "./generate/index.mjs";
export * from "./KeyGenerateCommand.mjs";
export * from "./migrate/index.mjs";
export * from "./project/CreateProjectCommand.mjs";
export * from "./queue/GenerateQueueMigrateCommand.mjs";
export * from "./StartCommand.mjs";

import { cli } from "../../facades.mjs";
import { CreateProjectCommand } from "./project/CreateProjectCommand.mjs";

cli().register(CreateProjectCommand);
