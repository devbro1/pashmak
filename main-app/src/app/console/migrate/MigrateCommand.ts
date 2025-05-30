import { cli, db as database } from "@root/facades";
import { Command, Option } from "clipanion";
import { Blueprint } from "neko-sql/src/Blueprint";
import { ctx, context_provider } from "neko-helper/src/context";
import { DatabaseServiceProvider } from "@root/DatabaseServiceProvider";
import { runNext } from "neko-helper/src/patternEnforcer";
import { Middleware } from "neko-router/src";
import { Request, Response } from "neko-router/src/types";
import { PostgresqlConnection } from "neko-sql/src/databases/postgresql/PostgresqlConnection";
import { wait } from "neko-helper/src/time";
import path from "path";
import fs from "fs/promises";
import config from "config";
import { Migration } from "neko-sql/src/Migration";

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
      // this.context.stdout.write(`Hello Migrate Command!\n`);
      const db = database();
      const schema = db.getSchema();

      //create migration table if not exists
      if (!(await schema.tableExists("migrations"))) {
        await schema.createTable("migrations", (blueprint: Blueprint) => {
          blueprint.id();
          blueprint.timestamps();
          blueprint.string("filename");
          blueprint.integer("batch");
        });
      }

      const migrationsDir = config.get<string>("migration.path");
      let files: string[] = [];

      const dirEntries = await fs.readdir(migrationsDir);
      files = dirEntries.filter((entry) => entry.endsWith(".ts")).sort();
      let batch_number = await db.runQuery({
        sql: "select max(batch) as next_batch from migrations",
        bindings: [],
      });
      batch_number = batch_number[0].next_batch || 0;
      batch_number++;

      const migrations = await db.runQuery({
        sql: "select * from migrations order by created_at ASC",
        bindings: [],
      });

      const completed_migrations = migrations.map((r: any) => r.filename);
      const pending_migrations = files.filter(
        (file) => !completed_migrations.includes(file),
      );

      for (const class_to_migrate of pending_migrations) {
        this.context.stdout.write(`migrating up ${class_to_migrate}`);
        const ClassToMigrate = require(
          path.join(migrationsDir, class_to_migrate),
        ).default;
        const c: Migration = new ClassToMigrate();
        await c.up(db.getSchema());
        await db.runQuery({
          sql: "insert into migrations (filename, batch) values ($1,$2)",
          bindings: [class_to_migrate, batch_number],
        });
      }
    });
  }
}

cli().register(MigrateCommand);
