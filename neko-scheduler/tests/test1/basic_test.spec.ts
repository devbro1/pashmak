import { Scheduler } from '../../src';

describe('scheduler testing', () => {
  test('basic testing', async () => {
    const scheduler = new Scheduler();

    scheduler
      .call(() => {
        console.log('Hello World');
      })
      .setName('test1')
      .setCronTime('*/5 * * * *')
      .setTimezone('UTC');

    scheduler
      .call(() => {
        console.log('Hello World');
      })
      .setName('test2')
      .setCronTime('0 */2 * * *')
      .setTimezone('Canada/Eastern');

    scheduler
      .call(() => {
        console.log('Hello World');
      })
      .setCronTime('0 */3 * * *')
      .setTimezone('Canada/Eastern');

    expect(scheduler.getScheduleNames().length).toBe(2);
    expect(scheduler.getSchedules().length).toBe(3);

    expect(scheduler.findSchedule('test1')).toBeDefined();
    expect(scheduler.findSchedule('test1')?.getCronTime()).toBe('*/5 * * * *');
    expect(scheduler.findSchedule('test1')?.getTimezone()).toBe('UTC');

    expect(scheduler.findSchedule('test2')).toBeDefined();
    expect(scheduler.findSchedule('test2')?.getCronTime()).toBe('0 */2 * * *');
    expect(scheduler.findSchedule('test2')?.getTimezone()).toBe('Canada/Eastern');

    expect(scheduler.findSchedule('test3')).toBeUndefined();

    scheduler.findSchedule('test2')?.trigger();

    // @ts-ignore
    expect(scheduler.findSchedule('test2')?.cronJob).toBeUndefined;
    scheduler.findSchedule('test2')?.start();
    // @ts-ignore
    expect(scheduler.findSchedule('test2')?.cronJob).toBeDefined();

    scheduler.findSchedule('test2')?.start();
    // @ts-ignore
    expect(scheduler.findSchedule('test2')?.cronJob).toBeDefined();

    scheduler.findSchedule('test2')?.stop();
    // @ts-ignore
    expect(scheduler.findSchedule('test2')?.cronJob).toBeUndefined;

    scheduler.start();

    for (const schedule of scheduler.getSchedules()) {
      // @ts-ignore
      expect(schedule.cronJob).toBeDefined();
    }

    scheduler.stop();

    for (const schedule of scheduler.getSchedules()) {
      // @ts-ignore
      expect(schedule.cronJob).toBeUndefined();
    }

    const s = scheduler.call(() => {
      console.log('Hello World');
    });

    expect(() => s.setCronTime('BAD_CRON_STRING')).toThrow();
  });
});
