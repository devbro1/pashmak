import { cli } from "@root/facades";
import { Command, Option } from "clipanion";

/*
pashmak make migration <FILENAME>
pashmak migrate 
pashmak migrate status # return status of existing migrations in db
pashmak migrate rollback
pashmak migrate refresh # doing all roll back then migrate
pashmak migrate fresh # removing all tables then migrate
*/
export class MigrateCommand extends Command {
  static paths = [[`migrate`]];
  async execute() {
    this.context.stdout.write(`Hello Migrate Command!\n`);
  }
}

cli().register(MigrateCommand);
