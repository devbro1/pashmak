# @devbro/neko-scheduler

customizable cron/scheduling solution with support for context.

```ts
import { Scheduler } from '@devbro/neko-scheduler';

const scheduler = new Scheduler();

//if you want to add a wrapper around all your schedules.
scheduler.setContextWrapper(async (tickFunction: Function) => {
  // ???
  await tickFunction();
  // ???
});

scheduler.setErrorHandler((err: any) => {
  console.log('scheduler error', err);
});

scheduler
  .call(() => {
    console.log('Hello World');
  })
  .setName('test1')
  .setCronTime('*/5 * * * *')
  .setTimezone('UTC');

scheduler.start();
scheduler.stop();
```
