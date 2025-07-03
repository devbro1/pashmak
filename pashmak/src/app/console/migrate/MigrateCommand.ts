import { cli, db as database, logger } from "../../../facades";
import { Command, Option } from "clipanion";
import { Blueprint } from "neko-sql";
import { context_provider } from "neko-helper";
import path from "path";
import fs from "fs/promises";
import { config } from "neko-config";
import { Migration } from "neko-sql";

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

  fresh = Option.Boolean("--fresh", false);

  async execute() {
    await context_provider.run(async () => {
      // this.context.stdout.write(`Hello Migrate Command!\n`);
      const db = database();
      const schema = db.getSchema();

      if (this.fresh) {
        logger().info("dropping all tables!!");
        let retry = true;
        let retry_count = 0;
        while (retry && retry_count < 10) {
          retry = false;
          retry_count++;
          const tables = await schema.tables();
          for (const table of tables) {
            logger().info(`dropping table ${table.name}`);
            try {
              await schema.dropTable(table.name);
            } catch {
              logger().info(`failed to drop ${table.name}`);
              retry = true;
            }
          }
        }
      }

      //create migration table if not exists
      if (!(await schema.tableExists("migrations"))) {
        await schema.createTable("migrations", (blueprint: Blueprint) => {
          blueprint.id();
          blueprint.timestamps();
          blueprint.string("filename");
          blueprint.integer("batch");
        });
      }

      const migrationsDir = config.get("migration.path");
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
        logger().info(`migrating up ${class_to_migrate}`);
        const ClassToMigrate = (await import(
          path.join(migrationsDir, class_to_migrate)
        )).default;
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
