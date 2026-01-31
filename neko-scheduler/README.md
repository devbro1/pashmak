# @devbro/neko-scheduler

A flexible and powerful cron-based task scheduler for Node.js and TypeScript with context wrapping and timezone support.

## Installation

```bash
npm install @devbro/neko-scheduler
```

## Features

- ⏰ **Cron-based Scheduling** - Schedule tasks using standard cron expressions
- 🌍 **Timezone Support** - Run tasks in any timezone
- 🎯 **Context Wrapper** - Wrap all scheduled tasks with custom context (DB connections, logging, etc.)
- ❌ **Error Handling** - Global error handler for all scheduled tasks
- 🔄 **Start/Stop Control** - Programmatically start and stop the scheduler
- 📝 **Named Tasks** - Give meaningful names to your scheduled jobs
- 🛡️ **Type-Safe** - Full TypeScript support
- 🎨 **Fluent API** - Chainable, intuitive interface

## Quick Start

```ts
import { Scheduler } from '@devbro/neko-scheduler';

// Create scheduler instance
const scheduler = new Scheduler();

// Schedule a simple task
scheduler
  .call(() => {
    console.log('Task executed!');
  })
  .setName('simple-task')
  .setCronTime('*/5 * * * *') // Every 5 minutes
  .setTimezone('UTC');

// Start the scheduler
scheduler.start();

// Later, stop the scheduler
// scheduler.stop();
```

## Core Concepts

### Creating a Scheduler

```ts
import { Scheduler } from '@devbro/neko-scheduler';

const scheduler = new Scheduler();
```

### Scheduling Tasks

Use the fluent API to define and configure tasks:

```ts
scheduler
  .call(async () => {
    // Your task logic here
    console.log('Performing scheduled task...');
  })
  .setName('my-task')
  .setCronTime('0 0 * * *') // Daily at midnight
  .setTimezone('America/New_York');
```

### Cron Expression Format

Cron expressions consist of 5 fields:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

**Common Examples:**

```ts
'* * * * *'; // Every minute
'*/5 * * * *'; // Every 5 minutes
'0 * * * *'; // Every hour
'0 0 * * *'; // Every day at midnight
'0 0 * * 0'; // Every Sunday at midnight
'0 0 1 * *'; // First day of every month at midnight
'0 9 * * 1-5'; // Weekdays at 9 AM
'0 0,12 * * *'; // Every day at midnight and noon
'*/15 9-17 * * *'; // Every 15 minutes from 9 AM to 5 PM
```

### Starting and Stopping

```ts
// Start the scheduler
scheduler.start();

// Stop the scheduler
scheduler.stop();

// Restart the scheduler
scheduler.stop();
scheduler.start();
```

## Advanced Features

### Context Wrapper

Wrap all scheduled tasks with custom context like database connections, request context, or logging:

```ts
import { Scheduler } from '@devbro/neko-scheduler';

const scheduler = new Scheduler();

// Set up context wrapper
scheduler.setContextWrapper(async (tickFunction: Function) => {
  console.log('Before task execution');

  // Set up resources (DB connection, context, etc.)
  const db = await connectToDatabase();

  try {
    // Execute the actual task
    await tickFunction();
  } finally {
    // Clean up resources
    await db.disconnect();
    console.log('After task execution');
  }
});

// All scheduled tasks will run within this context
scheduler
  .call(async () => {
    console.log('Task is running with context wrapper');
    // Database connection is available here
  })
  .setName('context-aware-task')
  .setCronTime('*/10 * * * *');

scheduler.start();
```

**Use Cases for Context Wrapper:**

- Database connection management
- Request context initialization
- Performance monitoring
- Logging and audit trails
- Authentication/authorization setup
- Resource pooling

### Error Handling

Set a global error handler for all scheduled tasks:

```ts
import { Scheduler } from '@devbro/neko-scheduler';

const scheduler = new Scheduler();

// Global error handler
scheduler.setErrorHandler((error: any) => {
  console.error('Scheduler error occurred:', error);

  // Send to error tracking service
  // errorTracker.captureException(error);

  // Send alert
  // alerting.sendAlert(`Scheduled task failed: ${error.message}`);
});

scheduler
  .call(async () => {
    // If this task throws an error, it will be caught by the error handler
    throw new Error('Something went wrong!');
  })
  .setName('error-prone-task')
  .setCronTime('* * * * *');

scheduler.start();
```

### Timezone Support

Run tasks in specific timezones:

```ts
// Task runs at 9 AM New York time
scheduler
  .call(() => {
    console.log('Good morning, New York!');
  })
  .setName('ny-morning-task')
  .setCronTime('0 9 * * *')
  .setTimezone('America/New_York');

// Task runs at 5 PM Tokyo time
scheduler
  .call(() => {
    console.log('Good evening, Tokyo!');
  })
  .setName('tokyo-evening-task')
  .setCronTime('0 17 * * *')
  .setTimezone('Asia/Tokyo');

// Task runs at midnight UTC
scheduler
  .call(() => {
    console.log('Midnight UTC');
  })
  .setName('utc-midnight-task')
  .setCronTime('0 0 * * *')
  .setTimezone('UTC');

scheduler.start();
```

**Common Timezones:**

- `UTC`
- `America/New_York`
- `America/Los_Angeles`
- `Europe/London`
- `Europe/Paris`
- `Asia/Tokyo`
- `Asia/Shanghai`
- `Australia/Sydney`

## Real-World Examples

### Database Cleanup Task

```ts
import { Scheduler } from '@devbro/neko-scheduler';
import { database } from './database';

const scheduler = new Scheduler();

scheduler.setContextWrapper(async (tickFunction: Function) => {
  await database.connect();
  try {
    await tickFunction();
  } finally {
    await database.disconnect();
  }
});

scheduler
  .call(async () => {
    // Delete old records every day at 2 AM
    const deleted = await database.query(
      'DELETE FROM logs WHERE created_at < NOW() - INTERVAL 30 DAY'
    );
    console.log(`Cleaned up ${deleted.affectedRows} old log entries`);
  })
  .setName('cleanup-old-logs')
  .setCronTime('0 2 * * *')
  .setTimezone('UTC');

scheduler.start();
```

### Report Generation

```ts
scheduler
  .call(async () => {
    const report = await generateDailyReport();
    await sendEmailReport(report);
    console.log('Daily report sent successfully');
  })
  .setName('daily-report')
  .setCronTime('0 8 * * 1-5') // Weekdays at 8 AM
  .setTimezone('America/New_York');
```

### API Data Sync

```ts
scheduler
  .call(async () => {
    const data = await fetchExternalAPIData();
    await syncToDatabase(data);
    console.log(`Synced ${data.length} records`);
  })
  .setName('api-sync')
  .setCronTime('*/30 * * * *') // Every 30 minutes
  .setTimezone('UTC');
```

### Cache Warming

```ts
scheduler
  .call(async () => {
    await cache.warmUp(['popular-products', 'trending-articles', 'active-users']);
    console.log('Cache warmed successfully');
  })
  .setName('cache-warmer')
  .setCronTime('*/5 * * * *') // Every 5 minutes
  .setTimezone('UTC');
```

### Backup Task

```ts
scheduler
  .call(async () => {
    const timestamp = new Date().toISOString();
    await createDatabaseBackup(`backup-${timestamp}.sql`);
    await uploadToS3(`backup-${timestamp}.sql`);
    console.log('Backup completed and uploaded');
  })
  .setName('database-backup')
  .setCronTime('0 0 * * *') // Daily at midnight
  .setTimezone('UTC');
```

## Multiple Scheduled Tasks

You can schedule multiple tasks with a single scheduler instance:

```ts
import { Scheduler } from '@devbro/neko-scheduler';

const scheduler = new Scheduler();

// Task 1: Every minute
scheduler
  .call(() => console.log('Task 1 - Every minute'))
  .setName('task-1')
  .setCronTime('* * * * *');

// Task 2: Every 5 minutes
scheduler
  .call(() => console.log('Task 2 - Every 5 minutes'))
  .setName('task-2')
  .setCronTime('*/5 * * * *');

// Task 3: Daily at midnight
scheduler
  .call(() => console.log('Task 3 - Daily at midnight'))
  .setName('task-3')
  .setCronTime('0 0 * * *')
  .setTimezone('UTC');

// Start all tasks
scheduler.start();
```

## Best Practices

1. **Name Your Tasks** - Always use `.setName()` for easier debugging and logging
2. **Set Timezones** - Explicitly set timezone to avoid confusion
3. **Error Handling** - Always set an error handler to catch and log failures
4. **Context Management** - Use context wrapper for resource management
5. **Async Functions** - Use async/await for asynchronous operations
6. **Graceful Shutdown** - Call `scheduler.stop()` on application shutdown
7. **Monitoring** - Log task execution for monitoring and debugging
8. **Idempotency** - Design tasks to be safely re-runnable

## Complete Example

```ts
import { Scheduler } from '@devbro/neko-scheduler';
import { logger } from './logger';
import { database } from './database';

// Create scheduler
const scheduler = new Scheduler();

// Set up context wrapper
scheduler.setContextWrapper(async (tickFunction: Function) => {
  const startTime = Date.now();
  logger.info('Task execution started');

  await database.connect();

  try {
    await tickFunction();
    const duration = Date.now() - startTime;
    logger.info(`Task completed in ${duration}ms`);
  } catch (error) {
    logger.error('Task execution failed', error);
    throw error;
  } finally {
    await database.disconnect();
  }
});

// Global error handler
scheduler.setErrorHandler((error: any) => {
  logger.error('Scheduler error:', error);
  // Send to error tracking service
  // Sentry.captureException(error);
});

// Schedule tasks
scheduler
  .call(async () => {
    const users = await database.getActiveUsers();
    logger.info(`Found ${users.length} active users`);
  })
  .setName('user-activity-check')
  .setCronTime('*/15 * * * *')
  .setTimezone('UTC');

scheduler
  .call(async () => {
    await database.cleanupExpiredSessions();
    logger.info('Cleaned up expired sessions');
  })
  .setName('session-cleanup')
  .setCronTime('0 */6 * * *') // Every 6 hours
  .setTimezone('UTC');

// Start scheduler
scheduler.start();
logger.info('Scheduler started successfully');

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, stopping scheduler');
  scheduler.stop();
  process.exit(0);
});
```

## TypeScript Support

Full TypeScript definitions included:

```ts
import { Scheduler } from '@devbro/neko-scheduler';

const scheduler: Scheduler = new Scheduler();

// Type-safe task functions
scheduler
  .call(async (): Promise<void> => {
    // Your typed task logic
  })
  .setName('typed-task')
  .setCronTime('* * * * *')
  .setTimezone('UTC');
```

## API Reference

### `Scheduler`

#### Methods

##### `call(fn: Function): this`

Set the function to be executed on schedule.

```ts
scheduler.call(() => console.log('Task executed'));
scheduler.call(async () => await performTask());
```

##### `setName(name: string): this`

Set a descriptive name for the scheduled task.

```ts
scheduler.setName('daily-cleanup');
```

##### `setCronTime(cronExpression: string): this`

Set the cron expression for scheduling.

```ts
scheduler.setCronTime('0 0 * * *'); // Daily at midnight
```

##### `setTimezone(timezone: string): this`

Set the timezone for the scheduled task.

```ts
scheduler.setTimezone('America/New_York');
```

##### `start(): void`

Start the scheduler and begin executing scheduled tasks.

```ts
scheduler.start();
```

##### `stop(): void`

Stop the scheduler and cease all scheduled tasks.

```ts
scheduler.stop();
```

##### `setContextWrapper(wrapper: (tickFunction: Function) => Promise<void>): void`

Set a context wrapper that runs around all scheduled tasks.

```ts
scheduler.setContextWrapper(async (tickFunction) => {
  // Setup
  await tickFunction();
  // Teardown
});
```

##### `setErrorHandler(handler: (error: any) => void): void`

Set a global error handler for all scheduled tasks.

```ts
scheduler.setErrorHandler((error) => {
  console.error('Error:', error);
});
```

## Troubleshooting

### Task Not Running

- Verify cron expression is correct using a [cron expression validator](https://crontab.guru/)
- Ensure `scheduler.start()` has been called
- Check error handler for any errors
- Verify timezone is correct

### Tasks Running at Wrong Time

- Double-check timezone setting
- Verify server system time is correct
- Use UTC for consistency across servers

### Memory Leaks

- Always call `scheduler.stop()` when shutting down
- Ensure context wrapper properly cleans up resources
- Avoid creating new schedulers repeatedly

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Packages

- [@devbro/neko-queue](https://www.npmjs.com/package/@devbro/neko-queue) - Queue management
- [@devbro/neko-logger](https://www.npmjs.com/package/@devbro/neko-logger) - Logging utilities
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework
