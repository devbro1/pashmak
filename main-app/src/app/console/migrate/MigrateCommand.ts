import { cli, db as database } from "@root/facades";
import { Command, Option } from "clipanion";
import { Blueprint } from "neko-sql/src/Blueprint";
import { ctx, context_provider } from "neko-helper/src/context";
import { DatabaseServiceProvider } from "@root/DatabaseServiceProvider";
import { runNext } from "neko-helper/src/patternEnforcer";
import { Middleware } from "neko-router/src";
import { Request, Response } from "neko-router/src/types";
import { PostgresqlConnection } from "neko-sql/src/databases/postgresql/PostgresqlConnection";

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
    await context_provider.run(async () => {
      this.context.stdout.write(`Hello Migrate Command!\n`);
      const db = database();
      let schema = db.getSchema();

      console.log(await schema.tables());
      console.log(await schema.tableExists("users"));
      //create migration table if not exists
      // if(!(await schema.tableExists('migrations'))) {
      //   await schema.createTable('migrations', (blueprint: Blueprint) => {
      //     blueprint.id();
      //     blueprint.timestamps();
      //     blueprint.string('filename');
      //     blueprint.integer('batch');
      //     blueprint.string('status').default('success').nullable(false);
      //   })
      // }

      // let files = []; //list of files with migration classes
      // let migrations = db.runQuery({sql: 'select * from migrations order by created_at ASC', bindings: []});

      // let already_migrated = []; // TODO
      // let need_migrations = []; // TODO

      // for(const class_to_migrate of need_migrations) {
      //   let c = new class_to_migrate();
      //   await c.up();
      //   await db.runQuery({sql: 'insert into migrations (filename, batch) values (?,?)', bindings:[class_to_migrate,2]});
      // }
    });
    // await PostgresqlConnection.destroy();
  }
}

cli().register(MigrateCommand);
