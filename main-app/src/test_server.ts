import dotenv from "dotenv";
dotenv.config();
process.env["NODE_CONFIG_DIR"] = __dirname + "/config/";
import config from "config";

import { cli } from "./facades";
import "./app/console";

import "./routes";
import "./schedules";
import { context_provider } from "neko-helper";
import { Middleware } from "neko-router/src";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import { runNext } from "neko-helper";
import { Request, Response } from "neko-router/src/types";

context_provider.setPreLoader(async (f: Function) => {
  const middlewares: Middleware[] = [];
  // do I need to use ServiceProvider like a middleware or can I get rid of this logic?
  middlewares.push(DatabaseServiceProvider.getInstance());

  return await runNext(
    middlewares,
    {} as Request,
    {} as Response,
    // @ts-ignore
    f,
  );
});

const [node, app, ...args] = process.argv;
cli()
  .runExit(args)
  .then(() => {})
  .catch((err) => {
    console.log(err);
  });
