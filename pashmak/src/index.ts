import dotenv from "dotenv";
import { context_provider } from "neko-helper";
import { Middleware } from "neko-router";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import { runNext } from "neko-helper";
import { Request, Response } from "neko-router";

export function bootstrap(options: { root_dir: string }): void {
  // This function is used to bootstrap the application.
  // It can be used to initialize the application, load configuration, etc.
  // Currently, it does nothing but can be extended in the future.
  dotenv.config();

  console.log("Bootstrapping application...");
  console.log(`Root directory: ${options.root_dir}`);
  process.env["NODE_CONFIG_DIR"] = options.root_dir + "/config/";
  require("config");

  require(`./app/console`);

  require(`${options.root_dir}/app/console`);
  require(`${options.root_dir}/routes`);
  require(`${options.root_dir}/schedules`);

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
}

