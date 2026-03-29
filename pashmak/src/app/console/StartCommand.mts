import { Command, Option } from "clipanion";
import { config } from "@devbro/neko-config";

import { cli, httpServer, logger, scheduler, queue } from "../../facades.mjs";
import { PostgresqlConnection } from "@devbro/neko-sql";

export class StartCommand extends Command {
  scheduler = Option.Boolean(`--scheduler`, false);
  cron = Option.Boolean(`--cron`, false);
  http = Option.Boolean(`--http`, false);
  queue = Option.Boolean(`--queue`, false);
  all = Option.Boolean("--all", false);
  static paths = [[`start`]];

  async execute() {
    if (
      [this.all, this.http, this.scheduler || this.cron, this.queue].filter(
        (x) => x,
      ).length == 0
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
      scheduler().start();
    }

    if (this.queue || this.all) {
      const config_queues = config.get("queues");
      for (const [name, conf] of Object.entries(config_queues)) {
        queue(name).start();
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
