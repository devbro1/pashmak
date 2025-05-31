import { cli } from "@root/facades";
import { Command, Option } from "clipanion";
import { Case } from "change-case-all";
import path from "path";
import * as fs from "fs/promises";
import config from "config";
import * as handlebars from "handlebars";

/*
pashmak make migration <FILENAME>
pashmak migrate 
pashmak migrate status # return status of existing migrations in db
pashmak migrate rollback
pashmak migrate refresh # doing all roll back then migrate
pashmak migrate fresh # removing all tables then migrate
*/
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

    const compiledTemplate = handlebars.compile(
      (
        await fs.readFile(path.join(__dirname, "./make_migration.tpl"))
      ).toString(),
    );
    const template = await compiledTemplate({
      className: Case.pascal(this.name),
    });

    await fs.writeFile(
      path.join(config.get("migration.path"), filename),
      template,
    );
  }
}

cli().register(MakeMigrateCommand);
