import { scheduler } from "./facades";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import { runNext } from "neko-helper";
import { Middleware } from "neko-router/src";
import { Request, Response } from "neko-router/src/types";
import { context_provider } from "neko-helper";
import { db } from "./facades";

scheduler()
  .call(async () => {
    await context_provider.run(async () => {
      console.log("Hello World");
      const d = db();
      const r = await d.runQuery({
        sql: "select * from users",
        bindings: [],
      });
    });
  })
  .setCronTime("* * * * *")
  .setRunOnStart(true);
