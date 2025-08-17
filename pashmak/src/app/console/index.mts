export * from "./migrate/index.mjs";
export * from "./StartCommand.mjs";
export * from "./DefaultCommand.mjs";
export * from "./KeyGenerateCommand.mjs";
export * from "./generate/index.mjs";
export * from "./project/CreateProjectCommand.mjs";

import { cli } from "../../facades.mjs";
import { CreateProjectCommand } from "./project/CreateProjectCommand.mjs";

cli().register(CreateProjectCommand);
