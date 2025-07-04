import { Command, Option } from "clipanion";
import { config } from "neko-config";

import { cli, httpServer, logger, scheduler } from "../../facades";
import { PostgresqlConnection } from "neko-sql";

export class StartCommand extends Command {
  scheduler = Option.Boolean(`--scheduler`, false);
  http = Option.Boolean(`--http`, false);
  all = Option.Boolean("--all", false);
  static paths = [[`start`]];

  async execute() {
    if ([this.all, this.http, this.scheduler].filter((x) => x).length == 0) {
      this.context.stdout.write(
        `No service was selected. please check -h for details\n`,
      );
      return;
    }

    logger().info(`Starting Server\n`);

    PostgresqlConnection.defaults.idleTimeoutMillis = 10000;

    if (this.scheduler || this.all) {
      logger().info(`starting scheduler\n`);
      scheduler().start();
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
