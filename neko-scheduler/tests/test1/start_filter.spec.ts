import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Scheduler } from '../../src';

describe('Scheduler.start(jobNames) filtering', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();

    scheduler
      .call(() => {})
      .setName('job1')
      .setCronTime('* * * * *');

    scheduler
      .call(() => {})
      .setName('job2')
      .setCronTime('* * * * *');

    // unnamed job
    scheduler.call(() => {}).setCronTime('* * * * *');
  });

  afterEach(() => {
    scheduler.stop();
  });

  test('start() with no arguments starts all jobs', () => {
    scheduler.start();

    for (const schedule of scheduler.getSchedules()) {
      // @ts-expect-error – private field
      expect(schedule.cronJob).toBeDefined();
    }
  });

  test('start([]) with empty array starts all jobs', () => {
    scheduler.start([]);

    for (const schedule of scheduler.getSchedules()) {
      // @ts-expect-error – private field
      expect(schedule.cronJob).toBeDefined();
    }
  });

  test('start([name]) starts only the matching named job', () => {
    scheduler.start(['job1']);

    // @ts-expect-error
    expect(scheduler.findSchedule('job1')!.cronJob).toBeDefined();
    // @ts-expect-error
    expect(scheduler.findSchedule('job2')!.cronJob).toBeUndefined();
  });

  test('start([name1, name2]) starts all listed named jobs', () => {
    scheduler.start(['job1', 'job2']);

    // @ts-expect-error
    expect(scheduler.findSchedule('job1')!.cronJob).toBeDefined();
    // @ts-expect-error
    expect(scheduler.findSchedule('job2')!.cronJob).toBeDefined();
  });

  test('start([name]) does not start the unnamed job', () => {
    scheduler.start(['job1']);

    const unnamedJob = scheduler.getSchedules().find((s) => s.getName() === '');
    // @ts-expect-error
    expect(unnamedJob!.cronJob).toBeUndefined();
  });

  test('start(["nonexistent"]) starts no jobs', () => {
    scheduler.start(['nonexistent']);

    for (const schedule of scheduler.getSchedules()) {
      // @ts-expect-error
      expect(schedule.cronJob).toBeUndefined();
    }
  });

  test('error handler is applied to all jobs regardless of filtering', () => {
    const errorHandler = vi.fn();
    scheduler.setErrorHandler(errorHandler);

    const setErrorHandlerSpy = vi
      .spyOn(scheduler.getSchedules()[0], 'setErrorHandler')
      .mockImplementation(() => {});
    const setErrorHandlerSpy2 = vi
      .spyOn(scheduler.getSchedules()[1], 'setErrorHandler')
      .mockImplementation(() => {});
    const setErrorHandlerSpy3 = vi
      .spyOn(scheduler.getSchedules()[2], 'setErrorHandler')
      .mockImplementation(() => {});

    scheduler.start(['job1']);

    // setErrorHandler called on all three jobs even though only job1 is started
    expect(setErrorHandlerSpy).toHaveBeenCalledTimes(1);
    expect(setErrorHandlerSpy2).toHaveBeenCalledTimes(1);
    expect(setErrorHandlerSpy3).toHaveBeenCalledTimes(1);
  });

  test('start() is idempotent when called twice with same filter', () => {
    scheduler.start(['job1']);
    scheduler.start(['job1']);

    // @ts-expect-error
    expect(scheduler.findSchedule('job1')!.cronJob).toBeDefined();
    // @ts-expect-error
    expect(scheduler.findSchedule('job2')!.cronJob).toBeUndefined();
  });
});
