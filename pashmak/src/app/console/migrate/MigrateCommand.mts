import { cli, db as database, logger } from "../../../facades.mjs";
import { Command, Option } from "clipanion";
import { Blueprint } from "@devbro/neko-sql";
import { context_provider } from "@devbro/neko-context";
import path from "path";
import fs from "fs/promises";
import { config } from "@devbro/neko-config";
import { Migration } from "@devbro/neko-sql";

export class MigrateCommand extends Command {
  static paths = [[`migrate`]];

  fresh = Option.Boolean(`--fresh`, false, {
    description: `whether to delete and recreate database`,
  });

  refresh = Option.Boolean(`--refresh`, false, {
    description: `whether to drop all tables before running migrations by using rollback function`,
  });

  async execute() {
    await context_provider.run(async () => {
      // this.context.stdout.write(`Hello Migrate Command!\n`);
      const db = database();
      const schema = db.getSchema();

      if (this.fresh) {
        throw new Error("not implemented");
      }

      if (this.refresh) {
        logger().info("reverting all migrations!!");
        // read all migrations and undo them all
        const existing_migrations = await db.runQuery({
          sql: "select * from migrations order by created_at DESC",
          parts: [],
          bindings: [],
        });

        const migrationsDir = config.get("migration.path");

        for (const migration_record of existing_migrations) {
          logger().info(`rolling back ${migration_record.filename}`);
          try {
            const MigrationClass = (
              await import(path.join(migrationsDir, migration_record.filename))
            ).default;
            const migrationInstance: Migration = new MigrationClass();

            // Call the down method to rollback the migration
            await migrationInstance.down(db.getSchema());

            // Remove the migration record from the migrations table
            await db.runQuery({
              sql: "delete from migrations where filename = $1",
              parts: [],
              bindings: [migration_record.filename],
            });
          } catch (error) {
            logger().error(
              `Failed to rollback migration ${migration_record.filename}: ${error}`,
            );
            throw error;
          }
        }

        logger().info(
          `rolled back ${existing_migrations.length} migrations successfully!`,
        );
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
      files = dirEntries
        .filter((entry) => entry.endsWith(".ts") || entry.endsWith(".js"))
        .sort();
      let batch_number = await db.runQuery({
        sql: "select max(batch) as next_batch from migrations",
        parts: [],
        bindings: [],
      });
      batch_number = batch_number[0].next_batch || 0;
      batch_number++;

      const migrations = await db.runQuery({
        sql: "select * from migrations order by created_at ASC",
        parts: [],
        bindings: [],
      });

      const completed_migrations = migrations.map((r: any) => r.filename);
      const pending_migrations = files.filter(
        (file) => !completed_migrations.includes(file),
      );

      let migrated_count = 0;
      for (const class_to_migrate of pending_migrations) {
        logger().info(`migrating up ${class_to_migrate}`);
        const ClassToMigrate = (
          await import(path.join(migrationsDir, class_to_migrate))
        ).default;
        const c: Migration = new ClassToMigrate();
        await c.up(db.getSchema());
        await db.runQuery({
          sql: "insert into migrations (filename, batch) values ($1,$2)",
          parts: [],
          bindings: [class_to_migrate, batch_number],
        });
        migrated_count++;
      }

      if (migrated_count === 0) {
        logger().warn("no migrations to run!");
        return;
      }

      logger().info(`migrated ${migrated_count} migrations successfully!`);
      return;
    });
  }
}

cli().register(MigrateCommand);
