import { cli } from "../../../facades";
import { Command, Option } from "clipanion";
import { Case } from "change-case-all";
import path from "path";
import * as fs from "fs/promises";
import { config } from "@devbro/neko-config";
import handlebars from "handlebars";
import { fileURLToPath } from "url";
import pluralize from "pluralize";

export class GenerateControllerCommand extends Command {
  static paths = [
    [`make`, `controller`],
    [`generate`, `controller`],
  ];

  name = Option.String({ required: true });

  async execute() {
    const rootDir = process.cwd();

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const secondsOfDay = String(
      date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(),
    ).padStart(5, "0");

    const fixed_name = Case.snake(this.name);
    const filename = `${Case.capital(this.name)}Controller.ts`;
    this.context.stdout.write(`creating migration file ${filename}\n`);

    await fs.mkdir(config.get("migration.path"), { recursive: true });

    let dirname = typeof __dirname === "string" ? __dirname : undefined;
    if (!dirname) {
      dirname = path.dirname(fileURLToPath(import.meta.url));
    }

    const compiledTemplate = handlebars.compile(
      (await fs.readFile(path.join(dirname, "./controller.tpl"))).toString(),
    );
    const template = await compiledTemplate({
      className: Case.pascal(this.name),
      classNameLower: Case.snake(this.name),
      routeName: Case.kebab(pluralize(this.name)),
    });

    await fs.writeFile(
      path.join(rootDir, "src/app/controllers", filename),
      template,
    );
  }
}

cli().register(GenerateControllerCommand);
