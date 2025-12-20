---
sidebar_position: 9
---

# Scheduler and Cron Jobs

Every system needs to run some tasks periodically. Pashmak provides a simple way to define and run scheduled tasks using cron syntax.

## Basic Usage

```ts
import { scheduler } from "@devbro/pashmak/facades";

scheduler()
  .call(async () => {
    console.log("This runs every minute");
  })
  .setCronTime("* * * * *")
  .setName("cleanup cron job")
  .setRunOnStart(true);
```

## Cron Syntax

The cron syntax follows the standard format:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, where 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Common Examples

```ts
// Every minute
scheduler().call(handler).setCronTime("* * * * *");

// Every hour at minute 0
scheduler().call(handler).setCronTime("0 * * * *");

// Every day at midnight
scheduler().call(handler).setCronTime("0 0 * * *");

// Every Monday at 9 AM
scheduler().call(handler).setCronTime("0 9 * * 1");

// Every 15 minutes
scheduler().call(handler).setCronTime("*/15 * * * *");

// First day of every month at midnight
scheduler().call(handler).setCronTime("0 0 1 * *");
```

## Scheduler Methods

### start() and stop()

Control the scheduler's execution:

```ts
import { scheduler } from "@devbro/pashmak/facades";

// Start all scheduled tasks
scheduler().start();

// Stop all scheduled tasks
scheduler().stop();
```

### getSchedules()

Get all currently registered schedules:

```ts
const schedules = scheduler().getSchedules();
console.log(`Found ${schedules.length} scheduled tasks`);
```

### findSchedule(name)

Find a specific schedule by its name:

```ts
const schedule = scheduler().findSchedule("cleanup cron job");
if (schedule) {
  console.log("Schedule found");
}
```

**Note:** Schedules must have a name set via `.setName()` to be findable.

### getScheduleNames()

Get all schedule names:

```ts
const names = scheduler().getScheduleNames();
console.log("Scheduled tasks:", names);
```

### setErrorHandler(handler)

Set a global error handler for all scheduled tasks:

```ts
import { logger } from "@devbro/pashmak/facades";

scheduler().setErrorHandler(async (error, scheduleName) => {
  logger().error({
    msg: "Scheduled task failed",
    scheduleName,
    error: error.message,
  });

  // Send notification, log to external service, etc.
});
```

### setContextWrapper(func)

Set a custom context wrapper function. This is an advanced feature for switching the context provider:

```ts
scheduler().setContextWrapper((fn) => {
  // Your custom context wrapper implementation
  return fn();
});
```

**Warning:** Only use this if you understand the context management system.

## Complete Example

```ts
// src/schedulers.ts
import { scheduler } from "@devbro/pashmak/facades";
import { logger } from "@devbro/pashmak/facades";
import { User } from "./app/models/User";

// Clean up old sessions every day at 2 AM
scheduler()
  .call(async () => {
    logger().info("Starting session cleanup");
    const deleted = await Session.deleteOlderThan(30); // days
    logger().info({ msg: "Session cleanup complete", deleted });
  })
  .setCronTime("0 2 * * *")
  .setName("session_cleanup")
  .setRunOnStart(false);

// Send daily digest emails every day at 8 AM
scheduler()
  .call(async () => {
    logger().info("Sending daily digest emails");
    const users = await User.getActiveUsers();
    for (const user of users) {
      await sendDigestEmail(user);
    }
    logger().info({ msg: "Digest emails sent", count: users.length });
  })
  .setCronTime("0 8 * * *")
  .setName("daily_digest")
  .setRunOnStart(false);

// Health check every 5 minutes
scheduler()
  .call(async () => {
    const healthy = await performHealthCheck();
    if (!healthy) {
      logger().error("Health check failed!");
    }
  })
  .setCronTime("*/5 * * * *")
  .setName("health_check")
  .setRunOnStart(true); // Run immediately on startup

// Set error handler
scheduler().setErrorHandler(async (error, scheduleName) => {
  logger().error({
    msg: "Scheduled task error",
    task: scheduleName,
    error: error.message,
    stack: error.stack,
  });
});
```

## Running the Scheduler

by default, the scheduler is start when the http server using `--all` flag.

```bash
npm run pdev start --all
# or
yarn pdev start --scheduler
# or
pnpm pdev start --cron # alternative name for --scheduler
```
