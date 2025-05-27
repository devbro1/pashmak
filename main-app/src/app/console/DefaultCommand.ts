import { Command, Option } from "clipanion";

export class DefaultCommand extends Command {
  async execute() {
    this.context.stdout.write(`Hello Default!\n`);
  }
}
