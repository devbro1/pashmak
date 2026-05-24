import { cli } from "@devbro/pashmak/facades";
import { Command, Option } from "clipanion";

export class YourFirstCommand extends Command {
  static paths = [[`hello`]];

  static usage = Command.Usage({
    category: `Main`,
    description: `First example command.`,
    details: `
        This command says hello to the world.
    `,
    examples: [],
  });

  async execute() {
    console.log("Hello world!");
  }
}

cli().register(YourFirstCommand);
