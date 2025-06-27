import { scheduler } from "@root/facades";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import { runNext } from "neko-helper";
import { Middleware } from "neko-router";
import { Request, Response } from "neko-router";
import { context_provider } from "neko-helper";
import { db } from "@root/facades";
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
