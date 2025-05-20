import { scheduler } from "./facades";

scheduler()
  .call(() => {
    console.log("Hello World");
  })
  .setCronTime("* * * * *")
  .setRunOnStart(true);
