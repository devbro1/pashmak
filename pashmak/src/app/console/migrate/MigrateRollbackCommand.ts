import { cli, db as database } from "@devbro/pashmak/src/facades";
import { Command, Option } from "clipanion";
import { context_provider } from "neko-helper";
import path from "path";
import fs from "fs/promises";
import config from "config";
import { Migration } from "neko-sql";
import * as t from "typanion";

export class MigrateRollbackCommand extends Command {
  static paths = [[`migrate`, "rollback"]];

  steps = Option.String(`--steps`, {
    description: `how many migrations to rollback`,
    validator: t.isNumber(),
  });

  async execute() {
    await context_provider.run(async () => {
      // this.context.stdout.write(`Hello Migrate Command!\n`);
      const db = database();
      const schema = db.getSchema();

      const migrationsDir = config.get<string>("migration.path");
      let files: string[] = [];

      const dirEntries = await fs.readdir(migrationsDir);
      files = dirEntries.filter((entry) => entry.endsWith(".ts")).sort();

      const migrations = await db.runQuery({
        sql: "select * from migrations order by created_at DESC",
        bindings: [],
      });

      const count = 0;
      for (const migration of migrations) {
        const class_to_migrate = migration.filename;
        this.context.stdout.write(`rolling back ${class_to_migrate}`);

        const ClassToMigrate = require(
          path.join(migrationsDir, class_to_migrate),
        ).default;

        const c: Migration = new ClassToMigrate();
        await c.down(db.getSchema());
        await db.runQuery({
          sql: "delete from migrations where id = $1",
          bindings: [migration.id],
        });
      }
    });
  }
}

cli().register(MigrateRollbackCommand);
