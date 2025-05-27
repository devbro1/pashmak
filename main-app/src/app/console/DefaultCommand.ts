import { Command, Option } from "clipanion";
import { cli } from "@root/facades";

export class DefaultCommand extends Command {
  static usage = Command.Usage({
    category: `Main`,
    description: `server management command line.`,
    details: `
      The base command for running and managing your server.

      Make sure you understand how things work.
    `,
    examples: [],
  });

  async execute() {
    this.context.stdout.write(`Hello Default!\n`);
  }
}

cli().register(DefaultCommand);
