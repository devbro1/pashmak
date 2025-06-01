import { Command, Option } from "clipanion";
import config from "config";

import { cli, httpServer, router, scheduler } from "@root/facades";
import { PostgresqlConnection } from "neko-sql/src/databases/postgresql/PostgresqlConnection";

export class StartCommand extends Command {
  scheduler = Option.Boolean(`--scheduler`, false);
  all = Option.Boolean("--all", false);
  static paths = [[`start`]];

  async execute() {
    this.context.stdout.write(`Starting Server\n`);

    PostgresqlConnection.defaults.idleTimeoutMillis = 10000;

    if (this.scheduler || this.all) {
      this.context.stdout.write(`starting scheduler\n`);
      scheduler().start();
    }

    const server = httpServer();
    await server.listen(config.get("port"), () => {
      console.log(
        "Server is running on http://localhost:" + config.get("port"),
      );
    });
  }
}

cli().register(StartCommand);
