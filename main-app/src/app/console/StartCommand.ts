import { Command, Option } from "clipanion";
import config from "config";

import { HttpServer } from "neko-http/src";
import { HttpError } from "http-errors";
import { cli, router, scheduler } from "@root/facades";

export class StartCommand extends Command {
  scheduler = Option.Boolean(`--scheduler`, false);
  static paths = [[`start`]];

  async execute() {
    this.context.stdout.write(`Hello Start Command!\n`);
    let server = new HttpServer();

    server.setErrorHandler(async (err: Error, req: any, res: any) => {
      if (err instanceof HttpError) {
        res.writeHead(err.statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: err.message }));
        console.log("HttpError:", err.message);
        return;
      } else {
        console.error("non HttpError:", err);
      }
      res.writeHead(500, { "Content-Type": "" });
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    });

    if (this.scheduler) {
      this.context.stdout.write(`starting scheduler\n`);
      scheduler().start();
    }
    server.setRouter(router());

    server.listen(config.get("port"), () => {
      console.log(
        "Server is running on http://localhost:" + config.get("port"),
      );
    });
  }
}

cli().register(StartCommand);
