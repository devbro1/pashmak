import { scheduler } from "./facades";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import { runNext } from "neko-helper/src";
import { Middleware } from "neko-router/src";
import { Request, Response } from "neko-router/src/types";
import { context_provider } from "neko-helper/src";
import { db } from "./facades";
import { logger } from "@root/facades";

scheduler()
  .call(async () => {
    await context_provider.run(async () => {
      logger().info("Hello World");
      const d = db();
      const r = await d.runQuery({
        sql: "select * from users",
        bindings: [],
      });
    });
  })
  .setCronTime("* * * * *")
  .setRunOnStart(true);

scheduler()
  .call(async () => {
    await context_provider.run(async () => {
      logger().info("Hello World2");
      const d = db();
      const r = await d.runQuery({
        sql: "select * from usersQWEQWE",
        bindings: [],
      });
    });
  })
  .setName("bad cron job")
  .setCronTime("* * * * *")
  .setRunOnStart(true);
