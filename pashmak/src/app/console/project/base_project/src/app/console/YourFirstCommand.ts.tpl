import { Command, Option } from "clipanion";
import { cli } from "@devbro/pashmak/facades";

export class YourFirstCommand extends Command {
    static paths = [
        [`hello`],
    ];

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
