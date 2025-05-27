import { Command, Option } from "clipanion";

export class MigrateCommand extends Command {
  static paths = [[`migrate`]];
  async execute() {
    this.context.stdout.write(`Hello Migrate Command!\n`);
  }
}
