import { Middleware } from "@devbro/neko-router";
import { Request, Response } from "@devbro/neko-router";
import { PostgresqlConnection } from "@devbro/neko-sql";
import { PoolConfig } from "pg";
import { Connection } from "@devbro/neko-sql";
import { BaseModel } from "@devbro/neko-orm";
import { ctx } from "@devbro/neko-context";
import { config } from "@devbro/neko-config";
import { Global } from "./global.mjs";

export class DatabaseServiceProvider extends Middleware {
  async call(
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> {
    const db_configs: Record<string, PoolConfig & { name: string }> =
      config.get("databases");

    const conns = [];
    try {
      for (const [name, db_config] of Object.entries(db_configs)) {
        const conn = await this.getConnection(db_config);
        ctx().set(["database", name], conn);
        conns.push(conn);
      }
      BaseModel.setConnection(async () => {
        const key = ["database", "default"];
        let rc: Connection | undefined;

        try {
          rc = ctx().get<Connection>(key);
        } catch {
          // context is not active
          if (Global.has(key)) {
            rc = Global.get<Connection>(key);
          } else {
            rc = await this.getConnection(db_configs["default"]);
            Global.set(key, rc);
          }
        }

        if (!rc) {
          throw new Error("unable to start default database connection");
        }

        return rc!;
      });
      await next();
    } finally {
      for (const conn of conns) {
        await conn.disconnect();
      }
    }
  }

  private static instance: DatabaseServiceProvider;

  async register(): Promise<void> {}

  static getInstance(): DatabaseServiceProvider {
    if (!DatabaseServiceProvider.instance) {
      DatabaseServiceProvider.instance = new DatabaseServiceProvider();
    }
    return DatabaseServiceProvider.instance;
  }

  async getConnection(db_config: PoolConfig): Promise<PostgresqlConnection> {
    const conn = new PostgresqlConnection(db_config);
    if (!(await conn.connect())) {
      throw new Error("Failed to connect to the database");
    }
    return conn;
  }
}
