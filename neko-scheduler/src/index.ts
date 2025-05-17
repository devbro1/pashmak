import { CronJob, CronJobParams, validateCronExpression } from 'cron';

export class Schedule {
  private cronJob: CronJob | undefined;
  private name: string = '';
  private timezone = '';
  private cronTime = '* * * * * *';

  constructor(private func: () => void) {}

  trigger(): void {
    this.func();
  }

  start(): void {
    if (this.cronJob && this.cronJob.isActive) {
      return;
    }

    this.cronJob = new CronJob(
      this.cronTime,
      this.func,
      null, // onComplete
      true, // start now
      this.timezone // timezone
    );
  }

  stop(): void {
    this.cronJob?.stop();
    this.cronJob = undefined;
  }

  setName(name: string): this {
    this.name = name;
    return this;
  }

  getName(): string {
    return this.name;
  }

  setTimezone(timezone: string): this {
    this.timezone = timezone;
    return this;
  }

  getTimezone(): string {
    return this.timezone;
  }

  setCronTime(cronTime: string): this {
    const validation = validateCronExpression(cronTime);
    if (!validation.valid) {
      throw validation.error;
    }
    this.cronTime = cronTime;
    return this;
  }
  getCronTime(): string {
    return this.cronTime;
  }
}

export class Scheduler {
  private jobs: Schedule[] = [];

  call(func: () => void): Schedule {
    const schedule = new Schedule(func);
    this.jobs.push(schedule);
    return schedule;
  }

  start() {
    for (const job of this.jobs) {
      job.start();
    }
  }

  stop() {
    for (const job of this.jobs) {
      job.stop();
    }
  }

  getSchedules(): Schedule[] {
    return this.jobs;
  }

  findSchedule(name: string): Schedule | undefined {
    return this.jobs.find((job) => job.getName() === name);
  }

  getScheduleNames(): string[] {
    return this.jobs.map((job) => job.getName()).filter((name) => name !== '') as string[];
  }
}
