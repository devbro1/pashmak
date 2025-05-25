import { scheduler } from "./facades";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import { runNext } from "neko-helper/src/patternEnforcer";
import { Middleware } from "neko-router/src";
import { Request, Response } from "neko-router/src/types";
import { context_provider } from "neko-helper/src/context";
import { db } from "./facades";

scheduler()
  .call(async () => {
    await context_provider.run(async () => {
      let middlewares: Middleware[] = [];
      middlewares.push(DatabaseServiceProvider.getInstance());

      await runNext(
        middlewares,
        {} as Request,
        {} as Response,
        async (req, res) => {
          console.log("Hello World");
          let d = db();
          let r = await d.runQuery({
            sql: "select * from users",
            bindings: [],
          });
        },
      );
    });
  })
  .setCronTime("* * * * *")
  .setRunOnStart(true);
