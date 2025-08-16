export * from "./migrate";
export * from "./StartCommand";
export * from "./DefaultCommand";
export * from "./KeyGenerateCommand";
export * from "./generate";
export * from "./project/CreateProjectCommand";

import { cli } from "../../facades.mjs";
import { CreateProjectCommand } from "./project/CreateProjectCommand";

cli().register(CreateProjectCommand);
