import { scheduler } from "@devbro/pashmak/src/facades";
import { context_provider } from "neko-helper";
import { db } from "@devbro/pashmak/src/facades";
import { logger } from "@devbro/pashmak/src/facades";

scheduler().setContextWrapper((fn: () => Promise<void>): () => Promise<void> => {
  return async (): Promise<void> => {
    await context_provider.run(async (): Promise<void> => {
      await fn();
    });
  };
});

scheduler()
  .call(async () => {
      logger().info("Hello World");
      const d = db();
      const r = await d.runQuery({
        sql: "select * from users",
        bindings: [],
      });
      logger().info({ msg: "query result", data: r });
  })
  .setCronTime("* * * * *")
  .setRunOnStart(true);

scheduler()
  .call(async () => {
      logger().info("Hello World2");
      const d = db();
      const r = await d.runQuery({
        sql: "select * from usersQWEQWE",
        bindings: [],
      });
  })
  .setName("bad cron job")
  .setCronTime("* * * * *")
  .setRunOnStart(true);
