import { Cli } from 'clipanion';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { StartCommand } from '../src/app/console/StartCommand.mjs';

const mocks = vi.hoisted(() => ({
  configValues: {
    queues: {},
    port: 3000,
  } as Record<string, any>,
  loggerInfo: vi.fn(),
  httpListen: vi.fn(),
  schedulerStart: vi.fn(),
  schedules: [] as any[],
  queueConnections: {} as Record<string, any>,
  cliRegister: vi.fn(),
}));

vi.mock('@devbro/neko-config', () => ({
  config: {
    get: vi.fn((key: string) => mocks.configValues[key]),
  },
}));

vi.mock('@devbro/neko-sql', () => ({
  PostgresqlConnection: {
    defaults: {},
  },
}));

vi.mock('../src/facades.mjs', () => ({
  cli: vi.fn(() => ({ register: mocks.cliRegister })),
  logger: vi.fn(() => ({ info: mocks.loggerInfo })),
  httpServer: vi.fn(() => ({ listen: mocks.httpListen })),
  scheduler: vi.fn(() => ({
    start: mocks.schedulerStart,
    getSchedules: () => mocks.schedules,
    errorHandler: vi.fn(),
  })),
  queue: vi.fn((name = 'default') => {
    if (!mocks.queueConnections[name]) {
      mocks.queueConnections[name] = {
        transport: {
          listeners: new Map<string, unknown>(),
        },
        start: vi.fn(),
      };
    }
    return mocks.queueConnections[name];
  }),
}));

describe('StartCommand', () => {
  const runCommand = async (args: string[]) => {
    const cli = new Cli();
    cli.register(StartCommand);
    await cli.run(args);
  };

  beforeEach(() => {
    mocks.configValues.queues = {};
    mocks.configValues.port = 3000;
    mocks.loggerInfo.mockReset();
    mocks.httpListen.mockReset();
    mocks.schedulerStart.mockReset();
    mocks.schedules = [];
    mocks.queueConnections = {};
    mocks.cliRegister.mockReset();
  });

  test('starts only selected queues by name and connection prefix', async () => {
    mocks.configValues.queues = { default: {}, secondary: {} };
    mocks.queueConnections.default = {
      transport: {
        listeners: new Map([
          ['email_welcome', vi.fn()],
          ['invoice_paid', vi.fn()],
        ]),
      },
      start: vi.fn(),
    };
    mocks.queueConnections.secondary = {
      transport: {
        listeners: new Map([
          ['email_retry', vi.fn()],
          ['reports_daily', vi.fn()],
        ]),
      },
      start: vi.fn(),
    };

    await runCommand(['start', '--queue', 'email_*', '--queue', 'secondary:reports_*']);

    expect(mocks.queueConnections.default.start).toHaveBeenCalledTimes(1);
    expect(Array.from(mocks.queueConnections.default.transport.listeners.keys())).toEqual(['email_welcome']);

    expect(mocks.queueConnections.secondary.start).toHaveBeenCalledTimes(1);
    expect(Array.from(mocks.queueConnections.secondary.transport.listeners.keys())).toEqual(['reports_daily']);
  });

  test('starts only selected crons by name and wildcard', async () => {
    const createSchedule = (name: string) => ({
      getName: () => name,
      setErrorHandler: vi.fn(),
      start: vi.fn(),
    });
    const hourly = createSchedule('hourly-sync');
    const daily = createSchedule('daily-report');
    const cleanup = createSchedule('cleanup');
    mocks.schedules = [hourly, daily, cleanup];

    await runCommand(['start', '--cron', 'daily-*', '--cron', 'hourly-sync']);

    expect(hourly.start).toHaveBeenCalledTimes(1);
    expect(daily.start).toHaveBeenCalledTimes(1);
    expect(cleanup.start).not.toHaveBeenCalled();
    expect(mocks.schedulerStart).not.toHaveBeenCalled();
  });
});
