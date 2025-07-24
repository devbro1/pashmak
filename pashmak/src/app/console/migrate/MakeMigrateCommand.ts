import { cli } from "../../../facades";
import { Command, Option } from "clipanion";
import { Case } from "change-case-all";
import path from "path";
import * as fs from "fs/promises";
import { config } from "@devbro/neko-config";
import handlebars from "handlebars";
import { fileURLToPath } from "url";
import { table } from "console";

export class MakeMigrateCommand extends Command {
  static paths = [
    [`make`, `migrate`],
    ["make", "migration"],
  ];

  name = Option.String({ required: true });

  async execute() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const secondsOfDay = String(
      date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(),
    ).padStart(5, "0");

    const fixed_name = Case.snake(this.name);
    const filename = `${year}_${month}_${day}_${secondsOfDay}_${fixed_name}.ts`;
    this.context.stdout.write(`creating migration file ${filename}\n`);

    await fs.mkdir(config.get("migration.path"), { recursive: true });

    let dirname = typeof __dirname === "string" ? __dirname : undefined;
    if (!dirname) {
      dirname = path.dirname(fileURLToPath(import.meta.url));
    }

    const compiledTemplate = handlebars.compile(
      (
        await fs.readFile(path.join(dirname, "./make_migration.tpl"))
      ).toString(),
    );
    const template = await compiledTemplate({
      className: Case.pascal(this.name) + "Migration",
      tableName: Case.snake(this.name),
    });

    await fs.writeFile(
      path.join(config.get("migration.path"), filename),
      template,
    );
  }
}

cli().register(MakeMigrateCommand);
