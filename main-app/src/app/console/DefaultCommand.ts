import { Command, Option } from "clipanion";
import { cli } from "@root/facades";

export class DefaultCommand extends Command {
  async execute() {
    this.context.stdout.write(`Hello Default!\n`);
  }
}

cli().register(DefaultCommand);
