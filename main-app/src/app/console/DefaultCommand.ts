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
    // @ts-ignore
    const commandList = cli().registrations; //.definitions().map((def:any) => def.paths.map((path:any) => path.join(' '))).flat();

    const paths: string[] = [];
    commandList.forEach((index, val) =>
      paths.push(index.builder.paths[0]?.join(" ") || ""),
    );

    console.log("Available commands:");
    for (const cmd of paths) {
      console.log(cmd);
    }
  }
}

cli().register(DefaultCommand);
