import { scheduler } from "@devbro/pashmak/facades";
import { logger } from "@devbro/pashmak/facades";

scheduler()
  .call(async () => {
    logger().info("{{className}} cron job running");
    // TODO: implement cron job logic
  })
  .setCronTime("* * * * *")
  .setName("{{classNameLower}} cron job")
  .setRunOnStart(false);
