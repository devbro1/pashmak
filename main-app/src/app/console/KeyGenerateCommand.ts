import { Command, Option } from "clipanion";
import { cli } from "@root/facades";

export class KeyGenerateCommand extends Command {
  static paths = [[`key`, "generate"]];

  static usage = Command.Usage({
    category: `Main`,
    description: `generate keys`,
    details: `
      TODO
    `,
    examples: [],
  });

  async execute() {
    console.log(__dirname);
    console.log(process.env);
  }
}

cli().register(KeyGenerateCommand);
