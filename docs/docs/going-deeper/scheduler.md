---
sidebar_position: 7
---

# Scheduler and Cron Jobs

Every system needs to run some tasks periodically. Pashmak provides a simple way to define and run scheduled tasks using cron syntax.

```ts
import { schedule } from "@devbro/pashmak/scheduler";

scheduler()
  .call(async () => {
    console.log("This runs every minute");
  })
  .setCronTime("* * * * *")
  .setName("redflag cron job")
  .setRunOnStart(true);
```

## Other scheduler methods

### scheduler().start();

### scheduler().stop();

to start and stop the scheduler.

### scheduler().getSchedules();

to get schedules currently registered

### scheduler().findSchedule('schedule_name');

find a schedule by its name. Note, if schedule has no name it cannot be found this way.

### scheduler().getScheduleNames();

to get all schedule names.

### scheduler().setContextWrapper(func);

There may be a time when you need to switch the context provider to your own implementation. then you can use this method to set your own context wrapper function. Unless you know what you are doing, do not call this method.

### scheduler().setErrorHandler(func);

to set a global error handler for all scheduled tasks. This is useful when you want to log errors or send notifications when a scheduled task fails.
