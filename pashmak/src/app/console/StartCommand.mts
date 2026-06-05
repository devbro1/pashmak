import { config } from '@devbro/neko-config';
import { PostgresqlConnection } from '@devbro/neko-sql';
import { Command, Option } from 'clipanion';
import { cli, httpServer, logger, queue, scheduler } from '../../facades.mjs';

type QueueTransportWithMaps = {
  listeners?: Map<string, unknown>;
  channels?: Map<string, unknown>;
};

type QueueConnectionWithTransport = {
  transport?: QueueTransportWithMaps;
};

type SchedulerWithErrorHandler = ReturnType<typeof scheduler> & {
  errorHandler?: (err: unknown, job: unknown) => void;
};

export class StartCommand extends Command {
  scheduler = Option.Boolean(`--scheduler`, false);
  http = Option.Boolean(`--http`, false);
  allCrons = Option.Boolean(`--all-crons`, false);
  crons = Option.Array(`--cron`);
  allQueues = Option.Boolean(`--all-queues`, false);
  queues = Option.Array(`--queue`);
  all = Option.Boolean('--all', false);
  static paths = [[`start`]];

  private globToRegExp(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`);
  }

  private matchesPattern(pattern: string, value: string): boolean {
    return this.globToRegExp(pattern).test(value);
  }

  private getQueueListenerMap(queueConnection: ReturnType<typeof queue>): Map<string, unknown> | null {
    const transport = (queueConnection as QueueConnectionWithTransport).transport;
    if (!transport) {
      return null;
    }

    if (transport.listeners instanceof Map) {
      return transport.listeners;
    }
    if (transport.channels instanceof Map) {
      return transport.channels;
    }

    return null;
  }

  private queueSelectorMatches(selector: string, connectionName: string, queueName: string): boolean {
    if (!selector.includes(':')) {
      return connectionName === 'default' && this.matchesPattern(selector, queueName);
    }

    const [connectionPattern, ...queuePatternParts] = selector.split(':');
    const queuePattern = queuePatternParts.join(':');
    if (!connectionPattern || !queuePattern) {
      return false;
    }

    return this.matchesPattern(connectionPattern, connectionName) && this.matchesPattern(queuePattern, queueName);
  }

  async execute() {
    if (
      [
        this.all,
        this.http,
        this.scheduler || this.allCrons || this.crons?.length,
        this.allQueues || this.queues?.length,
      ].filter((x) => x).length === 0
    ) {
      this.context.stdout.write(`No service was selected. please check -h for details\n`);
      return;
    }

    logger().info(`Starting Server\n`);

    PostgresqlConnection.defaults.idleTimeoutMillis = 10000;

    if (this.scheduler || this.allCrons || this.all) {
      logger().info(`starting scheduler\n`);
      scheduler().start();
    }

    if (this.crons?.length) {
      const scheduleManager = scheduler();
      const errorHandler = (scheduleManager as SchedulerWithErrorHandler).errorHandler;
      const schedules = scheduleManager.getSchedules();

      for (const schedule of schedules) {
        const scheduleName = schedule.getName();
        if (!scheduleName) {
          continue;
        }

        if (this.crons.some((cronSelector) => this.matchesPattern(cronSelector, scheduleName))) {
          if (errorHandler) {
            schedule.setErrorHandler(errorHandler);
          }
          schedule.start();
        }
      }
    }

    if (this.allQueues || this.all) {
      const config_queues = config.get('queues');
      for (const [name] of Object.entries(config_queues)) {
        queue(name).start();
      }
    }

    if (this.queues?.length) {
      const configuredQueues = config.get('queues');

      for (const connectionName of Object.keys(configuredQueues)) {
        const queueConnection = queue(connectionName);
        const listenerMap = this.getQueueListenerMap(queueConnection);
        if (!listenerMap) {
          continue;
        }

        const selectedQueueNames = Array.from(listenerMap.keys()).filter((queueName) =>
          this.queues.some((queueSelector) => this.queueSelectorMatches(queueSelector, connectionName, queueName))
        );

        if (selectedQueueNames.length === 0) {
          continue;
        }

        const selectedQueueSet = new Set(selectedQueueNames);
        for (const queueName of Array.from(listenerMap.keys())) {
          if (!selectedQueueSet.has(queueName)) {
            listenerMap.delete(queueName);
          }
        }

        queueConnection.start();
      }
    }

    if (this.http || this.all) {
      const server = httpServer();
      await server.listen(config.get('port'), () => {
        logger().info(`Server is running on http://localhost:${config.get('port')}`);
      });
    }
  }
}

cli().register(StartCommand);
