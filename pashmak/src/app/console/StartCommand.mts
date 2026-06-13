import { config } from "@devbro/neko-config";
import { PostgresqlConnection } from "@devbro/neko-sql";
import { Command, Option } from "clipanion";
import { cli, httpServer, logger, queue, scheduler } from "../../facades.mjs";

export class StartCommand extends Command {
  scheduler = Option.Boolean(`--scheduler`, false);
  cron_names = Option.Array(`--cron-names`, [], {
    description: "start only specific cron jobs",
  });
  cron = Option.Boolean(`--cron`, false);
  http = Option.Boolean(`--http`, false);
  queue = Option.Boolean(`--queue`, false);
  queue_channels = Option.Array(`--queue-channels`, [], {
    description: "start only specific queues",
  });
  all = Option.Boolean("--all", false);
  static paths = [[`start`]];

  async execute() {
    if (
      [this.all, this.http, this.scheduler || this.cron, this.queue].filter(
        (x) => x,
      ).length === 0
    ) {
      this.context.stdout.write(
        `No service was selected. please check -h for details\n`,
      );
      return;
    }

    logger().info(`Starting Server\n`);

    PostgresqlConnection.defaults.idleTimeoutMillis = 10000;

    if (this.scheduler || this.cron || this.all) {
      logger().info(`starting scheduler\n`);
      scheduler().start(this.cron_names);
    }

    if (this.queue || this.all) {
      const config_queues = config.get("queues");
      // if this.queue_channels is not empty, filter config_queues to only include those channels
      // this.queue_channels can have 3 types of entries:
      // 1. queue_name:* - start all channels of the given queue
      // 2. queue_name:channel_name - start only the given channel of the given queue
      // 3. channel_name - start said channel in default queue, so read it as default:channel_name
      let filtered_queues: Record<string, Set<string>> = {};
      if (this.queue_channels.length > 0) {
        for (const channel of this.queue_channels) {
          const [queue_name, channel_name] = channel.includes(":")
            ? channel.split(":")
            : ["default", channel];
          if (!config_queues[queue_name]) {
            logger().warn(`Queue not found in configuration`, { queue_name });
            continue;
          }
          if (!filtered_queues[queue_name]) {
            filtered_queues[queue_name] = new Set();
          }
          filtered_queues[queue_name].add(channel_name);
        }
      } else {
        filtered_queues = config_queues;
      }
      for (const [name, channels] of Object.entries(filtered_queues)) {
        queue(name).start(Array.from(channels));
      }
    }

    if (this.http || this.all) {
      const server = httpServer();
      await server.listen(config.get("port"), () => {
        logger().info(
          "Server is running on http://localhost:" + config.get("port"),
        );
      });
    }
  }
}

cli().register(StartCommand);
