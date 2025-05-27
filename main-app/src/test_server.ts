import dotenv from "dotenv";
dotenv.config();
process.env["NODE_CONFIG_DIR"] = __dirname + "/config/";
import config from "config";

import { cli } from "./facades";
import "./app/console";

import "./routes";
import "./schedules";

const [node, app, ...args] = process.argv;
cli().runExit(args);
